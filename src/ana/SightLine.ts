import { Viewer, Entity, Cartesian3, CallbackProperty, ColorMaterialProperty, Color, JulianDate, ClassificationType , HeightReference, Ray, Cartographic} from "cesium";
import {Graph} from 'cesium-plotting-symbol'
import  * as R from 'ramda'

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

  private getSightPoints(opos: Cartesian3, dpos: Cartesian3): Array<Array<{}>> {
    let distance = Cartesian3.distance(opos, dpos)
    if (distance<1) {
      return [dpos]
    }

    let intPos = []
    let step = 50
    for(let i=0; i<step; i++) {
      let pos = Cartesian3.lerp(opos, dpos, i/step, new Cartesian3())
      let co = Cartographic.fromCartesian(pos)
      co.height = this.viewer.scene.globe.getHeight(co)
      intPos.push({pt: co, index: i})
    }

    // 对视点的斜率，相对于初始斜率，变大或不变则可见，变小则不可见
    let humanHeight = 2
    let pos0 = intPos[0]
    let maxSlope = - Infinity
    for(let i=1; i<intPos.length; i++) {
      let pt = intPos[i]
      pt.slope = (pt.pt.height - pos0.pt.height+2) / pt.index
      if (pt.slope >= maxSlope) {
        pt.inSight = true
        maxSlope = pt.slope
      } else {
        pt.inSight = false
      }
    }
    let sightgp = R.groupWith( (pa, pb) => pa.inSight === pb.inSight, intPos)
    //console.log("get sight line group: ", sightgp)
    return R.drop(1, sightgp)
  }

  private addSightLine(ctl0: Entity, ctl1: Entity) {

    for(let i=0; i< 5; i++) {
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
            let peak = this.getSightPoints(opos, dpos)
            let poses = peak.filter( pks => !pks[0].inSight )
            if (poses.length > i) {
              let car3 = poses[i].map( pt => Cartographic.toCartesian(pt.pt, this.viewer.scene.globe.ellipsoid, new Cartesian3()))
              return car3
            } else {
              return undefined
            }
          }, false),
          clampToGround: true
        }
      })))
      let ent = this.entities.add(new Entity({
        name: '可视范围',
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
            let peak = this.getSightPoints(opos, dpos)
            let poses = peak.filter(pks => pks[0].inSight)
            if (poses.length > i) {
              return poses[i].map(pt => Cartographic.toCartesian(pt.pt, this.viewer.scene.globe.ellipsoid, new Cartesian3()))
            } else {
              return undefined
            }
          }, false),
          clampToGround: true
        }
      }))
      this.fillShape(ent)
    }

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
    // if (this.ctls.length > 1) {
    //   this.tempShapes.push(this.entities.add(new Entity({
    //     name: '遮挡点',
    //     point: {
    //       pixelSize: 19,
    //       color: Color.fromCssColorString('#ff0000'),
    //       heightReference: HeightReference.CLAMP_TO_GROUND,
    //     },
    //     position: new CallbackProperty((time, result) => {
    //       // let opos = this.ctls[0].position?.getValue(JulianDate.now())
    //       // let dpos = ctl.position?.getValue(JulianDate.now())
    //       // let peak = this.getSightPoints(opos, dpos)
    //       // return peak[0]
    //       return undefined
    //     }, false)
    //   })))
    // }
  }

  override decreaseTempShape(ctl: Entity): void {
    // this.entities.remove(this.tempShapes.pop())
  }
}
