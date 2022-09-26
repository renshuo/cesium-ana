import { Viewer, Entity, Cartesian3, CallbackProperty, ColorMaterialProperty, Color, JulianDate, ClassificationType , HeightReference, Ray} from "cesium";
import {Graph} from 'cesium-plotting-symbol'


export default class SightLine extends Graph  {

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

  private getSightPoints(opos: Cartesian3, dpos: Cartesian3): Cartesian3 {
    let pab = Cartesian3.subtract(dpos, opos, new Cartesian3())
    if (Cartesian3.magnitude(pab) == 0) {
      return dpos
    }
    let dir = Cartesian3.normalize(pab, new Cartesian3())
    let ray = new Ray(opos, dir)
    let interval = this.viewer.scene.globe.pick(ray, this.viewer.scene, new Cartesian3())

    if (interval) {
      let distance = Cartesian3.distance(opos, dpos)
      let intervalDistance = Cartesian3.distance(opos, interval)
      if (intervalDistance > distance) {
        return dpos
      }else {
        return interval
      }
    } else {
      return dpos
    }
  }

  private addSightLine(ctl0: Entity, ctl1: Entity) {
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
          let opos = ctl0.position?.getValue(JulianDate.now())
          let dpos = ctl1.position?.getValue(JulianDate.now())
          return [this.getSightPoints(opos, dpos), ctl1.position.getValue(time)]
        }, false),
        classificationType: ClassificationType.TERRAIN,
        clampToGround: false
      }
    })))

    let ent = this.entities.add(new Entity({
      name:  '可视范围',
      polyline: {
        width: new CallbackProperty((time, result) => this.props.width, true),
        material: new ColorMaterialProperty(
          new CallbackProperty(() => {
            let c = Color.fromCssColorString(this.props.color).withAlpha(this.props.alpha)
            return this.highLighted ? c.brighten(0.6, new Color()) : c
          }, true)),
        positions: new CallbackProperty((time, result) => {
          let opos = ctl0.position?.getValue(JulianDate.now())
          let dpos = ctl1.position?.getValue(JulianDate.now())
          return [ctl0.position.getValue(time), this.getSightPoints(opos, dpos)]
        }, false),
        clampToGround: false
      }
    }))
    this.fillShape(ent)
  }

  override increaseShape(ctl: Entity): void {
    if (this.ctls.length > 1) {
      this.addSightLine(this.ctls[0], ctl)
    } else {
      console.log("add origin point", ctl)
    }
  }

  override decreaseShape(ctl: Entity): void {
    super.decreaseShape(ctl)
    this.entities.remove(this.shapes.pop())
    this.entities.remove(this.shapes.pop())
  }

  override increaseTempShape(ctl: Entity): void {
    if (this.ctls.length > 1) {
      this.tempShapes.push(this.entities.add(new Entity({
        name: '遮挡点',
        point: {
          pixelSize: 19,
          color: Color.fromCssColorString('#ff0000'),
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        position: new CallbackProperty((time, result) => {
          let opos = this.ctls[0].position?.getValue(JulianDate.now())
          let dpos = ctl.position?.getValue(JulianDate.now())
          return this.getSightPoints(opos, dpos)
        }, false)
      })))
    }
  }

  override decreaseTempShape(ctl: Entity): void {
    this.entities.remove(this.tempShapes.pop())
  }
}
