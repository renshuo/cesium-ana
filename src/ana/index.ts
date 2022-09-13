import { Cartesian3, Cartographic, Color, Entity, JulianDate, Viewer } from 'cesium';
import { GraphManager } from 'cesium-plotting-symbol';
import * as turf from '@turf/turf';
import * as R from 'ramda';
import { Feature, featureCollection, FeatureCollection, Point, Polygon } from '@turf/turf';


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

  private cellSide = 10;
  private options = { units: 'meters' };

  private getHeight(lon: number, lat: number): Cartographic {
    let co = Cartographic.fromDegrees(lon , lat)
    let hei = this.viewer.scene.globe.getHeight(co)
    co.height = hei
    return co
  }

  private generateMaskSquareLine(square: Feature<Polygon>, hei: number): Array<Array<number>> {
    let pos = square.geometry.coordinates[0].slice(0, 4)
    let isHeigher = pos.map( p => this.getHeight(p[0], p[1]).height > hei)

    let code = isHeigher.map( b => b ? "1" : "0").join("")

    let points = pos.map( p => turf.point(p))

    switch(code) {
      case "0000": return []
      case "0001": return [[turf.midpoint(points[0], points[3]), turf.midpoint(points[2], points[3])]]
      case "0010": return [[turf.midpoint(points[1], points[2]), turf.midpoint(points[2], points[3])]]
      case "0011": return [[turf.midpoint(points[0], points[3]), turf.midpoint(points[1], points[2])]]
      case "0100": return [[turf.midpoint(points[0], points[1]), turf.midpoint(points[1], points[2])]]
      case "0101": return [[turf.midpoint(points[0], points[1]), turf.midpoint(points[0], points[3])], [turf.midpoint(points[2], points[1]), turf.midpoint(points[2], points[3])]]
      case "0110": return [[turf.midpoint(points[0], points[1]), turf.midpoint(points[2], points[3])]]
      case "0111": return [[turf.midpoint(points[0], points[1]), turf.midpoint(points[0], points[3])]]
      case "1000": return [[turf.midpoint(points[0], points[1]), turf.midpoint(points[0], points[3])]]
      case "1001": return [[turf.midpoint(points[0], points[1]), turf.midpoint(points[2], points[3])]]
      case "1010": return [[turf.midpoint(points[0], points[1]), turf.midpoint(points[0], points[3])], [turf.midpoint(points[2], points[1]), turf.midpoint(points[2], points[3])]]
      case "1011": return [[turf.midpoint(points[0], points[1]), turf.midpoint(points[1], points[2])]]
      case "1100": return [[turf.midpoint(points[0], points[3]), turf.midpoint(points[1], points[2])]]
      case "1101": return [[turf.midpoint(points[1], points[2]), turf.midpoint(points[2], points[3])]]
      case "1110": return [[turf.midpoint(points[0], points[3]), turf.midpoint(points[2], points[3])]]
      case "1111": return []
    }
  }


  private getHeightLineBySquare(points: Array<boolean>): Array<Feature<Point>> {

  }

  public createHeightLine() {
    let g = this.gm.create({ obj: 'Polygon', color: '#00FF00', fill: false, outlineColor: "#00ff00" })
    this.gm.setGraphFinishHandler((graph) => {
      let pos = graph.getCtlPositionsPos()
      let points: Array<Array<number>> = pos.map(p => [p.lon, p.lat])

      //get bbox
      let bx = turf.bbox(turf.lineString(points))
      console.log("get bbox: ", bx)

      //get point grid
      var grid = turf.pointGrid(bx, this.cellSide, this.options);
      console.log("get grid: ", grid)

      //get square grid
      let sgrid = turf.squareGrid(bx, this.cellSide, this.options)
      console.log("get square grid: ", sgrid)

      let points2 = points.concat([points[0]])
      let maskPolygon = turf.polygon([points2])
      console.log("get orging polygon: ", maskPolygon)

      let filtered = grid //turf.pointsWithinPolygon(grid, maskPolygon)
      console.log("get filtered points: ", filtered)

      //generate height data
      let cts = filtered.features.map(f => f.geometry.coordinates)
        .map(co => this.getHeight(co[0], co[1]))
      let cti = cts.map((co, i) => { return { carto: co, index: i} })
      console.log("get heights: ", cti)

      //get top and bottom
      let top = R.reduce(R.maxBy( ctin => ctin.carto.height), cti[0] , cti )
      let bottom = R.reduce(R.minBy( ctin => ctin.carto.height), cti[0], cti )
      console.log("get tiptop: ", top, bottom)

      let midHeight = (top.carto.height+bottom.carto.height)/2
      let hlines = sgrid.features.map( square => this.generateMaskSquareLine(square, midHeight))
//      console.log("get height lines: ", hlines)
      //draw heigh line
      hlines.map( lines => {
        lines.map( line => {
          let poss = line.map(ps => Cartesian3.fromDegrees(ps.geometry.coordinates[0], ps.geometry.coordinates[1]))
          this.viewer.entities.add(new Entity({
            polyline: {
              width: 2,
              positions: poss,
              material: Color.fromCssColorString("#ff0000"),
              clampToGround: true,
            }
          }))
        })
      })
    })
  }

}
