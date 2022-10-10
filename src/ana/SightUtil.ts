import { Cartesian3, Cartographic, Scene } from "cesium"
import * as R from "ramda"
import * as turf from "@turf/turf"

export interface SightLinePoint {
  point: Cartographic,
  group: number,
  index: number,
  slope: number,
  inSight: boolean
}

export function getSightPoints(opos: Cartesian3, dpos: Cartesian3, scene: Scene,
                               group: number = 0, // 视线分组
                               step: number = 100, // // 视线的切分数量
                               humanHeight: number = 2 // 原点的人身高度
                              ): Array<Array<SightLinePoint>> {
  let intPos: Array<SightLinePoint> = []
  for (let i = 0; i <= step; i++) {
    let pos = Cartesian3.lerp(opos, dpos, i / step, new Cartesian3())
    let co: Cartographic = Cartographic.fromCartesian(pos)
    co.height = scene.globe.getHeight(co)
    intPos.push({ point: co, group, index: i, slope: 0, inSight: true })
  }

  // 对视点的斜率，相对于初始斜率，变大或不变则可见，变小则不可见
  let height0 = intPos[0].point.height + humanHeight
  let maxSlope = - Infinity
  for (let i = 1; i < intPos.length; i++) {
    let pt = intPos[i]
    pt.slope = (pt.point.height - height0) / pt.index
    if (pt.slope >= maxSlope) {
      pt.inSight = true
      maxSlope = pt.slope
    } else {
      pt.inSight = false
    }
  }

  let sightgp = R.groupWith((pa: SightLinePoint, pb: SightLinePoint) => pa.inSight === pb.inSight, intPos)
  return sightgp
}


export function toArea(points: Array<Array<Array<SightLinePoint>>>): Array<Array<Array<SightLinePoint>>> {
  let grid = points.map(lines => {
    return lines.flat().map( slp => {
      return turf.point([slp.group, slp.index], { inSight: slp.inSight ? 1 : -1, slp })
    })
  })
  let areas = turf.isobands(turf.featureCollection(grid.flat()), [-2, 0, 2], { zProperty: 'inSight' })
  let xmax = grid.length - 1
  let ymax = grid[0].length - 1
  return areas.features.map( area => {
    return area.geometry.coordinates.map( pg => {
      return pg[0].map(ps => {
        let [x, y] = ps
        let x1 = x > xmax ? xmax : Math.floor(x)
        let y1 = y > ymax ? ymax : Math.floor(y)
        return grid[x1][y1].properties.slp
      })
    })
  })
}


