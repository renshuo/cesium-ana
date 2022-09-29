import { Viewer, Entity, Cartesian3, CallbackProperty, ColorMaterialProperty, Color, JulianDate, ClassificationType, HeightReference, Ray, Cartographic } from "cesium";
import { Graph } from 'cesium-plotting-symbol'
import { getSightPoints } from './SightUtil'

export default class SightLine extends Graph {

  maxPointNum: number = 2

  constructor(prop: {}, viewer: Viewer, layer: Entity) {
    super({
      type: '视域线',
      maskedColor: '#ff0000',
      clamp: false,
      width: 2,
      ...prop
    }, viewer, layer)
    this.propDefs.push(
      { name: 'maskedColor', title: '不可视段颜色', type: 'color', editable: true },
      { name: 'width', title: '线宽', type: 'number', editable: true, min: 1, max: 256 },
    )
  }

  private polylineNum = 5 // 视线的线段数，视线被分割过多时，会导致远处线段不绘制


  private addSightLine(ctl0: Entity, ctl1: Entity) {

    for (let i = 0; i < this.polylineNum; i++) {
      let posc = new CallbackProperty((time, result) => {
        let opos = ctl0.position?.getValue(JulianDate.now())
        let dpos = ctl1.position?.getValue(JulianDate.now())
        let peak = getSightPoints(opos, dpos, this.viewer.scene)
        let poses = peak.filter(pks => !pks[0].inSight)
        if (poses.length > i) {
          let car3 = poses[i].map(pt => Cartographic.toCartesian(pt.point, this.viewer.scene.globe.ellipsoid, new Cartesian3()))
          return car3
        } else {
          return undefined
        }
      }, false)

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
          positions: posc.getValue(JulianDate.now(), []),
          clampToGround: true
        }
      })))

      let nosc = new CallbackProperty((time, result) => {
        let opos = ctl0.position?.getValue(JulianDate.now())
        let dpos = ctl1.position?.getValue(JulianDate.now())
        let peak = getSightPoints(opos, dpos, this.viewer.scene)
        let poses = peak.filter(pks => pks[0].inSight)
        if (poses.length > i) {
          return poses[i].map(pt => Cartographic.toCartesian(pt.point, this.viewer.scene.globe.ellipsoid, new Cartesian3()))
        } else {
          return undefined
        }
      }, false)

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
          positions: nosc.getValue(JulianDate.now(), []),
          clampToGround: true
        }
      }))
      this.fillShape(ent)
    }
  }

  override finish() {
    super.finish()
    if (this.ctls.length > 1) {
      this.addSightLine(this.ctls[0], this.ctls[1])
    }
  }

  override increaseTempShape(ctl: Entity): void {
    if (this.ctls.length > 1) {
      this.tempShapes.push(this.entities.add(new Entity({
        name: '遮挡点',
        polyline: {
          width: 2,
          material: Color.BLUE.withAlpha(0.5),
          clampToGround: true,
          positions: new CallbackProperty((time, result) => {
            return this.ctls.map(ctl => ctl.position.getValue(time))
          }, false),
        }
      })))
    }
  }

  override decreaseTempShape(ctl: Entity): void {
    this.entities.remove(this.tempShapes.pop())
  }
}
