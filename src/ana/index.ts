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

  private generateMaskSquareLine1(square: Array<Cartographic>, hei: number): Array<Array<Cartesian3>> {
    let isHeigher = square.map( p => p.height > hei)
    let code = isHeigher.map( b => b ? "1" : "0").join("")
    let poses = square.map( p => Cartographic.toCartesian(p, this.viewer.scene.globe.ellipsoid))
    switch(code) {
      case "0000": return []
      case "0001": return [[Cartesian3.midpoint(poses[0], poses[3], new Cartesian3()), Cartesian3.midpoint(poses[2], poses[3], new Cartesian3())]]
      case "0010": return [[Cartesian3.midpoint(poses[1], poses[2], new Cartesian3()), Cartesian3.midpoint(poses[2], poses[3], new Cartesian3())]]
      case "0011": return [[Cartesian3.midpoint(poses[0], poses[3], new Cartesian3()), Cartesian3.midpoint(poses[1], poses[2], new Cartesian3())]]
      case "0100": return [[Cartesian3.midpoint(poses[0], poses[1], new Cartesian3()), Cartesian3.midpoint(poses[1], poses[2], new Cartesian3())]]
      case "0101": return [[Cartesian3.midpoint(poses[0], poses[1], new Cartesian3()), Cartesian3.midpoint(poses[0], poses[3], new Cartesian3())], [Cartesian3.midpoint(poses[2], poses[1], new Cartesian3()), Cartesian3.midpoint(poses[2], poses[3], new Cartesian3())]]
      case "0110": return [[Cartesian3.midpoint(poses[0], poses[1], new Cartesian3()), Cartesian3.midpoint(poses[2], poses[3], new Cartesian3())]]
      case "0111": return [[Cartesian3.midpoint(poses[0], poses[1], new Cartesian3()), Cartesian3.midpoint(poses[0], poses[3], new Cartesian3())]]
      case "1000": return [[Cartesian3.midpoint(poses[0], poses[1], new Cartesian3()), Cartesian3.midpoint(poses[0], poses[3], new Cartesian3())]]
      case "1001": return [[Cartesian3.midpoint(poses[0], poses[1], new Cartesian3()), Cartesian3.midpoint(poses[2], poses[3], new Cartesian3())]]
      case "1010": return [[Cartesian3.midpoint(poses[0], poses[1], new Cartesian3()), Cartesian3.midpoint(poses[0], poses[3], new Cartesian3())], [Cartesian3.midpoint(poses[2], poses[1], new Cartesian3()), Cartesian3.midpoint(poses[2], poses[3], new Cartesian3())]]
      case "1011": return [[Cartesian3.midpoint(poses[0], poses[1], new Cartesian3()), Cartesian3.midpoint(poses[1], poses[2], new Cartesian3())]]
      case "1100": return [[Cartesian3.midpoint(poses[0], poses[3], new Cartesian3()), Cartesian3.midpoint(poses[1], poses[2], new Cartesian3())]]
      case "1101": return [[Cartesian3.midpoint(poses[1], poses[2], new Cartesian3()), Cartesian3.midpoint(poses[2], poses[3], new Cartesian3())]]
      case "1110": return [[Cartesian3.midpoint(poses[0], poses[3], new Cartesian3()), Cartesian3.midpoint(poses[2], poses[3], new Cartesian3())]]
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

      //get square grid
      let sgrid = turf.squareGrid(bx, this.cellSide, this.options)
      console.log("get square grid: ", sgrid)

      let colist = sgrid.features.map( square => square.geometry.coordinates[0].slice(0,4))
        .map(poses => poses.map( pos => this.getHeight(pos[0], pos[1])))
      console.log("get cartographic list: ", colist)

      // filter grid TODO

      //get top and bottom
      let top = R.reduce(R.maxBy( co => co[0].height), colist[0] , colist )
      let bottom = R.reduce(R.minBy( co => co[0].height), colist[0], colist )
      let midHeight = (top[0].height + bottom[0].height) / 2
      console.log("get tiptop: ", top, bottom, midHeight)

      let hlines = colist.map( coary => this.generateMaskSquareLine1(coary, midHeight))
      console.log("get height line1: ", hlines)

      //draw heigh line
      hlines.map( lines => {
        lines.map( line => {
          this.viewer.entities.add(new Entity({
            polyline: {
              width: 2,
              positions: line,
              material: Color.fromCssColorString("#ff0000"),
              clampToGround: true,
            }
          }))
        })
      })
    })
  }

}
