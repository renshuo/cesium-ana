import { Cartesian3, Cartographic, Color, Entity, HeightReference, JulianDate, Viewer } from 'cesium';
import { GraphManager } from 'cesium-plotting-symbol';
import * as turf from '@turf/turf';
import * as R from 'ramda';
import { FeatureCollection } from '@turf/turf';


export default class HeightLine {

  public heiBreakDelta = 100

  private pointGridOptions = {
    cellSide: 50,
    options: { units: 'meters' }
  }

  private viewer: Viewer
  private gm: GraphManager

  constructor(viewer: Viewer, gm: GraphManager) {
    this.viewer = viewer
    this.gm = gm
  }

  public createHeightLine() {
    let g = this.gm.create({
      obj: 'Rectangle', fill: true, alpha: 0.2, clamp: true,
      finishHandler: (self) => {
        if (!self.isHeightLined) {
          this.drawHeightLine(self)
        } else {
          console.log("hight line is drawed")
        }
      }
    })
  }

  private getHeightNum(lon: number, lat: number): number {
    let co = Cartographic.fromDegrees(lon, lat)
    return this.viewer.scene.globe.getHeight(co)
  }

  private getBreaks(grid: FeatureCollection): Array<number> {
    let top = R.reduce(R.maxBy(p => p.properties.height), grid.features[0], grid.features)
    let bottom = R.reduce(R.minBy(p => p.properties.height), grid.features[0], grid.features)
    let topHei = top.properties.height
    let bottomHei = bottom.properties.height
    console.log("get tiptop: ", topHei, bottomHei)

    let bottomCeil = Math.ceil(bottomHei / this.heiBreakDelta) - 1
    let topCeil = Math.ceil(topHei / this.heiBreakDelta)
    let breaks = R.range(bottomCeil, topCeil).map(n => n * this.heiBreakDelta)
    console.log("get breaks: ", breaks)
    return breaks
  }

  private drawHeightLine(graph) {
    let pos = graph.getCtlPositionsPos()
    let points: Array<Array<number>> = [
      [pos[0].longitude, pos[0].latitude],
      [pos[1].longitude, pos[0].latitude],
      [pos[1].longitude, pos[1].latitude],
      [pos[0].longitude, pos[1].latitude],
    ] //pos.map(p => [p.longitude, p.latitude])

    //get bbox
    let bx = turf.bbox(turf.lineString(points))
    console.log("get bbox: ", bx)

    //get point grid
    let grid = turf.pointGrid(bx, this.pointGridOptions.cellSide, this.pointGridOptions.options);
    console.log("get grid: ", grid)

    //generate height data
    grid.features
      .map((f, i) => {
        let co = f.geometry.coordinates
        let hei = this.getHeightNum(co[0], co[1])
        f.properties.height = hei
        f.properties.index = i
        return f
      })
    console.log("get heights: ", grid)

    let breaks = this.getBreaks(grid)

    let hlines = turf.isolines(grid, breaks, { zProperty: "height" })
    console.log("get height lines: ", hlines)

    hlines.features.map(lines => {
      let lineHei: number = lines.properties.height
      lines.geometry.coordinates.map(line => {
        let poss = line.map(p =>
          Cartesian3.fromDegrees(p[0], p[1], lineHei)
        )
        this.viewer.entities.add(new Entity({
          polyline: {
            width: 2,
            positions: poss,
            material: Color.fromCssColorString("#ff0000"),
            clampToGround: true,
          }
        }))
      })
    }) // end drawing hlines
    graph.isHeightLined = true
  }

}
