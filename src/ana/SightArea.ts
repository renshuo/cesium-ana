import { Graph } from 'cesium-plotting-symbol'
import { Viewer, Entity, Cartesian3, CallbackProperty, Color, JulianDate, HeightReference, Cartographic, PolygonHierarchy, Math, Iso8601 } from "cesium";
import * as turf from "@turf/turf";
import { Feature } from '@turf/turf';
import { getSightPoints, toArea, SightLinePoint } from './SightUtil'


export default class SightArea extends Graph{

  maxPointNum: number = 2

  constructor(prop: {}, viewer: Viewer, layer: Entity) {
    super({
      type: '视域分析',
      maskedColor: '#ff0000',
      clamp: false,
      ...prop
    }, viewer, layer)
  }

  override initShape() {
    this.tempShapes.push(this.entities.add(new Entity({
      polyline: {
        width: 2,
        positions: new CallbackProperty((time, result) => {
          return this.ctls.map(ctl => ctl.position.getValue(time))
        }, false),
        material: Color.BLUE,
        clampToGround: true
      }
    })))
  }


  private drawAreas(areas: Array<Array<Array<SightLinePoint>>>) {
    let brighten = 0.2
    let alpha = 0.5
    let colrs = [Color.RED.withAlpha(alpha).brighten(brighten, new Color()), Color.GREEN.withAlpha(alpha).brighten(brighten, new Color())]
    areas.map((area, i) => {
      area.map(pg => {
        let poses = pg.map(p => {
          let co = p.point
          //co.height = co.height + 10
          return Cartographic.toCartesian(co, this.viewer.scene.globe.ellipsoid, new Cartesian3())
        })
        this.entities.add(new Entity({
          polygon: {
            fill: true,
            material: colrs[i],
            hierarchy: new PolygonHierarchy(poses, []),
            //perPositionHeight: true
            heightReference: HeightReference.CLAMP_TO_GROUND
          }
        }))
      })
    })
  }

  private drawAreaPoints(peaksss) {
    let peaks = peaksss.flat().flat()

    let inSightArea = peaks.filter(p => p.inSight === true)
    let outSight = peaks.filter(p => p.inSight === false)

    peaks.map( pk => {
      let color = pk.inSight ? Color.GREEN : Color.RED
      this.entities.add(new Entity({
        point: {
          pixelSize: 5,
          color: color,
        },
        position: Cartographic.toCartesian(pk.point, this.viewer.scene.globe.ellipsoid, new Cartesian3())
      }))
    })
  }

  override finish() {
    super.finish()
    console.log(" create sight area")
    let p1 = this.ctlToPoint(this.ctls[0])
    let p2 = this.ctlToPoint(this.ctls[1])
    let tgts = this.getTarget(p1, p2)
    //console.log("get target point list : ", tgts)
    let origin = this.ctls[0].position.getValue(JulianDate.now())
    let peaksss = tgts.map( (tgt,i) => {
      return getSightPoints(origin, tgt, this.viewer.scene, i)
    })
    //this.drawAreaPoints(peaksss)
    //console.log('get sight line peak group list: ', peaksss)
    let areas = toArea(peaksss)
    //console.log('get sight area polygons: ', areas)
    this.drawAreas(areas)
  }

  sightRadian:number = 60 //视角范围角度
  sightArcSteps = 100 // 视角采样数量

  private getTarget(center: Feature<turf.Point>, p1: Feature<turf.Point>) {
    var radius = turf.distance(center, p1, { unites: 'meters' });
    var bear0 = turf.bearing(center, p1)
    var arc = turf.lineArc(center, radius, bear0-this.sightRadian/2, bear0+this.sightRadian/2, {steps: this.sightArcSteps * 360/this.sightRadian});
    let cood = turf.getCoords(arc)
    return cood.map(pos => Cartesian3.fromDegrees(pos[0], pos[1]))
  }

  private ctlToPoint(ctl: Entity): turf.Point {
    let pos = ctl.position.getValue(JulianDate.now())
    let co = Cartographic.fromCartesian(pos, this.viewer.scene.globe.ellipsoid)
    let pt = turf.point([Math.toDegrees(co.longitude), Math.toDegrees(co.latitude)])
    pt.properties.height = co.height
    return pt
  }
}
