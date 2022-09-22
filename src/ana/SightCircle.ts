import SightLine from "./SightLine"
import { Viewer, Entity, Cartesian3, CallbackProperty, ColorMaterialProperty, Color, JulianDate, ClassificationType, HeightReference, Ray, Cartographic } from "cesium";
import * as turf from '@turf/turf';
import { Feature, Polygon } from "@turf/turf";
import R from 'ramda'

export default class SightCircle extends SightLine {


  maxPointNum: number = 2
  option = { steps: 32, unites: 'meters' }
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
    //console.log("get pos: ", centerPos, ppos)

    let option = { unites: 'meters' }
    var radius = turf.distance(center, to, option);

    var bearing1 = i===0 ? 0 : 360 / this.steps *( i-1);
    var bearing2 = 360 / this.steps * i;

    var arc = turf.lineArc(center, radius, bearing1, bearing2, option);
    let lastPos = arc.geometry.coordinates.pop()
    let opos2 = Cartesian3.fromDegrees(lastPos[0], lastPos[1], centerPos.height)
    return opos2
  }

  override increaseShape(ctl: Entity): void {
    if (this.ctls.length > 1) {
      this.addSightLineGroup(this.ctls[0], ctl)
    } else {
      console.log("add origin point", ctl)
    }
  }

  private addSightLineGroup(center: Entity, p1: Entity) {
    for (let i = 0; i < this.steps; i++) {
      this.shapes.push(this.entities.add(new Entity({
        name: '不可视部分',
        polyline: {
          width: new CallbackProperty((time, result) => this.props.width, true),
          material: new ColorMaterialProperty(
            new CallbackProperty(() => {
              let c = Color.fromCssColorString(this.props.maskedColor).withAlpha(this.props.alpha)
              return this.highLighted ? c.brighten(0.6, new Color()) : c
            }, true)),
          positions: new CallbackProperty((time, result) => {
            let cpos = center.position?.getValue(JulianDate.now())
            let opos = p1.position?.getValue(JulianDate.now())
            let opos2 = this.getTargetPoint(cpos, opos, i)
            return [this.getSightPoints(cpos, opos2), opos2]
          }, false),
          //classificationType: ClassificationType.TERRAIN,
          clampToGround: false
        }
      })))

      this.shapes.push(this.entities.add(new Entity({
        name: '可视范围',
        polyline: {
          width: new CallbackProperty((time, result) => this.props.width, true),
          material: new ColorMaterialProperty(
            new CallbackProperty(() => {
              let c = Color.fromCssColorString(this.props.color).withAlpha(this.props.alpha)
              return this.highLighted ? c.brighten(0.6, new Color()) : c
            }, true)),
          positions: new CallbackProperty((time, result) => {
            let cpos = center.position?.getValue(JulianDate.now())
            let opos = p1.position?.getValue(JulianDate.now())
            let opos2 = this.getTargetPoint(cpos, opos, i)
            return [cpos, this.getSightPoints(cpos, opos2)]
          }, false),
          clampToGround: false
        }
      })))
    }
  }



}
