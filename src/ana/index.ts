import { Cartesian3, Cartographic, Color, Entity, JulianDate, Viewer } from 'cesium';
import { GraphManager } from 'cesium-plotting-symbol';
import HeightLine from './HeightLine';
import SightLine from './SightLine';


export default class CesiumAnalyzer {

  private viewer: Viewer
  private gm: GraphManager

  public heightLine: HeightLine

  constructor(viewer: Viewer) {
    this.viewer = viewer
    this.gm = new GraphManager(viewer, {
      layerId: 'ana',
      editAfterCreate: true
    })

    this.heightLine = new HeightLine(this.viewer, this.gm)
  }

  public createHeightLine() {
    this.heightLine.createHeightLine()
  }

  public createSightLine() {
    let obj = new SightLine({}, this.viewer, this.gm.layer);
    this.gm.em.create(obj)
  }
}
