import { Viewer, Entity, Cartesian3, CallbackProperty, ColorMaterialProperty, Color, JulianDate, ClassificationType, HeightReference, Ray, Cartographic } from "cesium";
import { Graph } from 'cesium-plotting-symbol'
import * as R from 'ramda'

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

  private humanHeight = 2 // 原点的人身高度
  private step = 50 // 视线的切分数量
  private polylineNum = 5 // 视线的线段数，视线被分割过多时，会导致远处线段不绘制

  private getSightPoints(opos: Cartesian3, dpos: Cartesian3): Array<Array<{}>> {
    let intPos = []
    for (let i = 0; i < this.step; i++) {
      let pos = Cartesian3.lerp(opos, dpos, i / this.step, new Cartesian3())
      let co = Cartographic.fromCartesian(pos)
      co.height = this.viewer.scene.globe.getHeight(co)
      intPos.push({ pt: co, index: i })
    }

    // 对视点的斜率，相对于初始斜率，变大或不变则可见，变小则不可见
    let height0 = intPos[0].pt.height + this.humanHeight
    let maxSlope = - Infinity
    for (let i = 1; i < intPos.length; i++) {
      let pt = intPos[i]
      pt.slope = (pt.pt.height - height0) / pt.index
      if (pt.slope >= maxSlope) {
        pt.inSight = true
        maxSlope = pt.slope
      } else {
        pt.inSight = false
      }
    }
    let sightgp = R.groupWith((pa, pb) => pa.inSight === pb.inSight, intPos)
    return R.drop(1, sightgp)
  }

  private addSightLine(ctl0: Entity, ctl1: Entity) {

    for (let i = 0; i < this.polylineNum; i++) {
      let posc = new CallbackProperty((time, result) => {
        let opos = ctl0.position?.getValue(JulianDate.now())
        let dpos = ctl1.position?.getValue(JulianDate.now())
        let peak = this.getSightPoints(opos, dpos)
        let poses = peak.filter(pks => !pks[0].inSight)
        if (poses.length > i) {
          let car3 = poses[i].map(pt => Cartographic.toCartesian(pt.pt, this.viewer.scene.globe.ellipsoid, new Cartesian3()))
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
        let peak = this.getSightPoints(opos, dpos)
        let poses = peak.filter(pks => pks[0].inSight)
        if (poses.length > i) {
          return poses[i].map(pt => Cartographic.toCartesian(pt.pt, this.viewer.scene.globe.ellipsoid, new Cartesian3()))
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
          material: Color.fromCssColorString("#00aa00").withAlpha(0.8),
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
