import { Graph } from 'cesium-plotting-symbol'
import { Viewer, Entity, Cartesian3, CallbackProperty, Color, JulianDate, HeightReference, Cartographic, PolygonHierarchy } from "cesium";
import * as turf from "@turf/turf";


export default class SightArea extends Graph{

  constructor(prop: {}, viewer: Viewer, layer: Entity) {
    super({
      type: '视域分析',
      maskedColor: '#ff0000',
      clamp: false,
      ...prop
    }, viewer, layer)
  }


  override finish() {
    console.log(" create sight area")
    
  }
}
