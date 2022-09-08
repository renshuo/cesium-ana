import { Cartesian3, Cartographic, Color, Entity, JulianDate, Viewer } from 'cesium';
import { GraphManager } from 'cesium-plotting-symbol';
import * as turf from '@turf/turf';
import * as R from 'ramda';


export default class CesiumAnalyzer {

  private viewer: Viewer
  private gm: GraphManager

  constructor(viewer: Viewer) {
    this.viewer = viewer
    this.gm = new GraphManager(viewer, {
      layerId: 'ana',
      editAfterCreate: true
    })
  }


  private cellSide = 3;
  private options = { units: 'kilometers' };

  public createHeightLine() {
    let g = this.gm.create({ obj: 'Polygon', color: '#00FF00', fill: false, outlineColor: "#00ff00" })
    this.gm.setGraphFinishHandler((graph) => {
      let pos = graph.getCtlPositionsPos()
      let points: Array<Array<number>> = pos.map(p => [p.lon, p.lat])
      let bx = turf.bbox(turf.lineString(points))
      console.log("get bbox: ", bx)

      var grid = turf.pointGrid(bx, this.cellSide, this.options);
      console.log("get grid: ", grid)

      let points2 = points.concat([points[0]])
      let maskPolygon = turf.polygon([points2])
      console.log("get orging polygon: ", maskPolygon)

      let filtered = turf.pointsWithinPolygon(grid, maskPolygon)
      console.log("get filtered points: ", filtered)

      //generate height data
      let cts = filtered.features.map(f => f.geometry.coordinates)
        .map(co => Cartographic.fromDegrees(co[0], co[1]))
        .map(co => {
          let hei = this.viewer.scene.globe.getHeight(co)
          co.height = hei
          return co
        })
      let cti = cts.map((co, i) => { return { carto: co, index: i} })
      console.log("get heights: ", cti)

      //get top and bottom
      let top = R.reduce(R.maxBy( ctin => ctin.carto.height), cti[0] , cti )
      let bottom = R.reduce(R.minBy( ctin => ctin.carto.height), cti[0], cti )
      console.log("get tiptop: ", top, bottom)


      //draw points grid
      let poss = cti
        .map(px => {
          let color = Color.fromCssColorString("#0000bb")
          if (px.index == top.index) {
            color = Color.fromCssColorString("#ff0000")
          }
          if (px.index == bottom.index) {
            color = Color.fromCssColorString("#00ff00")
          }
          this.viewer.entities.add(new Entity({
            point: {
              pixelSize: 10,
              color: color,
            },
            position: Cartographic.toCartesian(px.carto)
          }))
        })
    })
  }

}
