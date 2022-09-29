import { Cartesian3, Cartographic, Color, Entity, JulianDate, Viewer } from 'cesium';
import { GraphManager} from 'cesium-plotting-symbol';
import HeightLine from './HeightLine';
import SightCircle from './SightCircle';
import SightLine from './SightLine';
import SightArea from './SightArea';

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

  public createSightCircle() {
    let obj = new SightCircle({}, this.viewer, this.gm.layer);
    this.gm.em.create(obj)
  }

  public createSightArea() {
    let obj = new SightArea({}, this.viewer, this.gm.layer);
    this.gm.em.create(obj)
  }
}
