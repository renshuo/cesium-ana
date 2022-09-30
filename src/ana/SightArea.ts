import { Graph } from 'cesium-plotting-symbol'
import { Viewer, Entity, Cartesian3, CallbackProperty, Color, JulianDate, HeightReference, Cartographic, PolygonHierarchy, Math } from "cesium";
import * as turf from "@turf/turf";
import { Feature } from '@turf/turf';
import { getSightPoints } from './SightUtil'


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

  override finish() {
    super.finish()
    console.log(" create sight area")
    let p1 = this.ctlToPoint(this.ctls[0])
    let p2 = this.ctlToPoint(this.ctls[1])
    console.log("get point: ", p1, p2)
    let tgts = this.getTarget(p1, p2)
    console.log("get target : ", tgts)
    let peaksss = tgts.map( tgt => {
      return getSightPoints(this.ctls[0].position.getValue(JulianDate.now()), tgt, this.viewer.scene)
    })

    console.log("get peaks : ", peaksss.map( peakss => peakss.flat()))

    let peaks = peaksss.flat().flat()

    let inSightArea = peaks.filter( p => p.inSight === true)
    let outSight = peaks.filter( p => p.inSight === false)


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

  private getTarget(center: Feature<turf.Point>, p1: Feature<turf.Point>) {
    var radius = turf.distance(center, p1, { unites: 'meters' });
    var bear0 = turf.bearing(center, p1)
    var arc = turf.lineArc(center, radius, bear0-30, bear0+30);
    let cood = turf.getCoords(arc)
    console.log("get cood: ", cood)
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
