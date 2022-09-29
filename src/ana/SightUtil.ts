import { Cartesian3, Cartographic, Scene } from "cesium"
import * as R from "ramda"


export interface SightLinePoint {
  point: Cartographic,
  index: number,
  slope: number,
  inSight: boolean
}

export function getSightPoints(opos: Cartesian3, dpos: Cartesian3, scene: Scene,
                               step: number = 50, // // 视线的切分数量
                               humanHeight: number = 2 // 原点的人身高度
                              ): Array<Array<SightLinePoint>> {
  let intPos: Array<SightLinePoint> = []
  for (let i = 0; i < step; i++) {
    let pos = Cartesian3.lerp(opos, dpos, i / step, new Cartesian3())
    let co: Cartographic = Cartographic.fromCartesian(pos)
    co.height = scene.globe.getHeight(co)
    intPos.push({ point: co, index: i, slope: 0, inSight: false })
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
  return R.drop(1, sightgp)
}
