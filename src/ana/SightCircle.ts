import SightLine from "./SightLine"
import { Viewer, Entity, Cartesian3, CallbackProperty, ColorMaterialProperty, Color, JulianDate, ClassificationType, HeightReference, Ray, Cartographic, PolygonHierarchy } from "cesium";
import * as turf from '@turf/turf';
import { Feature, Polygon } from "@turf/turf";
import R from 'ramda'

export default class SightCircle extends SightLine {


  maxPointNum: number = 2
  option = { steps: 36, unites: 'meters' }
  steps = 32

  constructor(prop: {}, viewer: Viewer, layer: Entity) {
    super({
      type: '圆形通视',
      maskedColor: '#ff0000',
      clamp: false,
      ...prop
    }, viewer, layer)
  }

  private getTargetPoint(cpos: Cartesian3, p1: Cartesian3, i: number): Cartesian3 {
    let centerPos = this.Cartesian3ToPosition(cpos)
    var center = turf.point([centerPos.longitude, centerPos.latitude]);
    let ppos = this.Cartesian3ToPosition(p1)
    var to = turf.point([ppos.longitude, ppos.latitude]);

    let option = { unites: 'meters' }
    var radius = turf.distance(center, to, option);
    var bearing2 = 360 / this.steps * i;
    let targetPos = turf.destination(center, radius, bearing2, option)
    return Cartesian3.fromDegrees(targetPos.geometry.coordinates[0], targetPos.geometry.coordinates[1], centerPos.height)
  }

  override increaseShape(ctl: Entity): void {
    if (this.ctls.length > 1) {
      this.addSightLineGroup(this.ctls[0], ctl)
    } else {
      console.log("add origin point", ctl)
    }
  }

  private addSightLineGroup(center: Entity, p1: Entity) {
    this.shapes.push(this.entities.add(new Entity({
      polygon: {
        fill: false,
        outline: true,
        outlineColor: Color.BLUE.withAlpha(0.3),
        outlineWidth: 2,
        hierarchy: new CallbackProperty((time, result) => {
          let cpos = center.position?.getValue(JulianDate.now())
          let opos = p1.position?.getValue(JulianDate.now())
          let poslist: Array<Cartesian3> = []
          for (let i = 0; i < this.steps; i++) {
            let opos2 = this.getTargetPoint(cpos, opos, i)
            poslist.push(opos2)
          }
          return new PolygonHierarchy(poslist, [])
        }, false),
        perPositionHeight: true,
      }
    })))

    for (let i = 0; i < this.steps; i++) {
      for (let j = 0; j < this.polylineNum; j++) {
        this.shapes.push(this.entities.add(new Entity({
          name: '不可视部分',
          polyline: {
            width: 2, //new CallbackProperty((time, result) => this.props.width, true),
            material: Color.fromCssColorString(this.props.maskedColor).withAlpha(this.props.alpha),
            //material: Color.RED.brighten(0.3, new Color()), // new ColorMaterialProperty(
              // new CallbackProperty(() => {
              //   let c = Color.fromCssColorString(this.props.maskedColor).withAlpha(this.props.alpha)
              //   return this.highLighted ? c.brighten(0.6, new Color()) : c
              // }, true)),
            positions: new CallbackProperty((time, result) => {
              let cpos = center.position?.getValue(JulianDate.now())
              let opos = p1.position?.getValue(JulianDate.now())
              let opos2 = this.getTargetPoint(cpos, opos, i)
              let peak = this.getSightPoints(cpos, opos2)

              let poses = peak.filter(pks => !pks[0].inSight)
              if (poses.length > j) {
                let car3 = poses[j].map(pt => Cartographic.toCartesian(pt.pt, this.viewer.scene.globe.ellipsoid, new Cartesian3()))
                return car3
              } else {
                return undefined
              }
            }, false),
            clampToGround: true
          }
        })))

        this.shapes.push(this.entities.add(new Entity({
          name: '可视范围',
          polyline: {
            width: 2, //new CallbackProperty((time, result) => this.props.width, true),
            material: Color.fromCssColorString(this.props.color).withAlpha(this.props.alpha),
              //material: new ColorMaterialProperty(
              // new CallbackProperty(() => {
              //   let c = Color.fromCssColorString(this.props.color).withAlpha(this.props.alpha)
              //   return this.highLighted ? c.brighten(0.6, new Color()) : c
              // }, true)),
            positions: new CallbackProperty((time, result) => {
              let cpos = center.position?.getValue(JulianDate.now())
              let opos = p1.position?.getValue(JulianDate.now())
              let opos2 = this.getTargetPoint(cpos, opos, i)
              let peak = this.getSightPoints(cpos, opos2)
              let poses = peak.filter(pks => pks[0].inSight)
              if (poses.length > j) {
                let car3 = poses[j].map(pt => Cartographic.toCartesian(pt.pt, this.viewer.scene.globe.ellipsoid, new Cartesian3()))
                return car3
              } else {
                return undefined
              }
            }, false),
            clampToGround: true
          }
        })))
      }
    }
  }

}
