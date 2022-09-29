import {Graph} from 'cesium-plotting-symbol'
import { Viewer, Entity, Cartesian3, CallbackProperty, Color, JulianDate, HeightReference, Cartographic, PolygonHierarchy } from "cesium";
import * as Cesium from 'cesium';
import * as turf from '@turf/turf';
import {getSightPoints} from './SightUtil'

export default class SightCircle extends Graph {

  maxPointNum: number = 2
  option = { steps: 36, unites: 'meters' }
  steps = 32
  private polylineNum = 5 // 视线的线段数，视线被分割过多时，会导致远处线段不绘制

  constructor(prop: {}, viewer: Viewer, layer: Entity) {
    super({
      type: '圆形通视',
      maskedColor: '#ff0000',
      clamp: false,
      ...prop
    }, viewer, layer)
  }

  private getAllTarget(center: Cartesian3, p1: Cartesian3): Array<Cartesian3> {
    let centerPos = this.Cartesian3ToPosition(center)
    let centerPt = turf.point([centerPos.longitude, centerPos.latitude])
    let p1Pos = this.Cartesian3ToPosition(p1)
    let p1Pt = turf.point([p1Pos.longitude, p1Pos.latitude])

    var radius = turf.distance(centerPt, p1Pt, { unites: 'meters' });

    let circle = turf.circle(centerPt, radius, { steps: this.steps, unites: 'meters' })
    let cood = turf.getCoords(circle)
    return cood[0].slice(1).map(pos => Cartesian3.fromDegrees(pos[0], pos[1]))
  }

  override finish() {
    super.finish()
    if (this.ctls.length > 1) {
      let centerPos = this.ctls[0].position.getValue(JulianDate.now())
      let tgts = this.getAllTarget(centerPos, this.ctls[1].position.getValue(JulianDate.now()))
      tgts.map(tgt => {
        for (let i = 0; i < this.polylineNum; i++) {
          let peak = getSightPoints(centerPos, tgt, this.viewer.scene)
          let poses = peak.filter(pks => !pks[0].inSight)
          let car3 = undefined
          if (poses.length > i) {
            car3 = poses[i].map(pt => Cartographic.toCartesian(pt.point, this.viewer.scene.globe.ellipsoid, new Cartesian3()))
          }

          this.shapes.push(this.entities.add(new Entity({
            name: '不可视部分',
            polyline: {
              width: 2, // new CallbackProperty((time, result) => this.props.width, true),
              material: Color.fromCssColorString(this.props.maskedColor).withAlpha(this.props.alpha),
              //material: new ColorMaterialProperty(
              // new CallbackProperty(() => {
              //   let c = Color.fromCssColorString(this.props.maskedColor).withAlpha(this.props.alpha)
              //   return this.highLighted ? c.brighten(0.6, new Color()) : c
              // }, true)),
              positions: car3,
              clampToGround: true
            }
          })))

          poses = peak.filter(pks => pks[0].inSight)
          if (poses.length > i) {
            car3 = poses[i].map(pt => Cartographic.toCartesian(pt.point, this.viewer.scene.globe.ellipsoid, new Cartesian3()))
          }

          let ent = this.entities.add(new Entity({
            name: '可视范围',
            polyline: {
              width: 2, //new CallbackProperty((time, result) => this.props.width, true),
              material: Color.fromCssColorString(this.props.color).withAlpha(this.props.alpha),
              //material: new ColorMaterialProperty(
              // new CallbackProperty(() => {
              //   let c = Color.fromCssColorString(this.props.color).withAlpha(this.props.alpha)
              //   return this.highLighted ? c.brighten(0.6, new Color()) : c
              // }, true)),
              positions: car3,
              clampToGround: true
            }
          }))
          this.fillShape(ent)
        }
      })
      console.log("get target points: ", tgts)
    }
  }

  override increaseShape(ctl: Cesium.Entity): void {
    if (this.ctls.length > 1) {
      this.addOutline(this.ctls[0], ctl)
    } else {
      console.log("add origin point", ctl)
    }
  }

  private addOutline(center: Entity, p1: Entity) {
    this.tempShapes.push(this.entities.add(new Entity({
      polygon: {
        fill: true,
        material: Color.BLUE.withAlpha(0.05),
        hierarchy: new CallbackProperty((time, result) => {
          let cpos = center.position?.getValue(JulianDate.now())
          let opos = p1.position?.getValue(JulianDate.now())
          let poslist = this.getAllTarget(cpos, opos)
          return new PolygonHierarchy(poslist, [])
        }, false),
        heightReference: HeightReference.CLAMP_TO_GROUND,
      }
    })))
  }

}
