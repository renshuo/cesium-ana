<template>
  <div style="position: relative">
    <div style="position: fixed; z-index: 10; left: 20px; top: 20px; color: white">
      <button class="tbt" @click="heightLine">等高线</button>
      <button class="tbt" @click="createSightLine">通视线</button> 
      <button class="tbt" @click="createSightCircle">圆形通视</button> 
      <button class="tbt" @click="createSightArea">视域分析</button> 
    </div>

    <div id="mapContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
window.CESIUM_BASE_URL = "/Cesium";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import CesiumAna from './ana/index.ts'

function heightLine() {
  window.ca.createHeightLine()
}
function createSightLine() {
  window.ca.createSightLine()
}

function createSightCircle() {
  window.ca.createSightCircle()
}

function createSightArea() {
  window.ca.createSightArea()
}

onMounted(() => {
  Cesium.Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNWY5YzhhMS05ZmYxLTQ5NzgtOTcwNC0zZmViNGFjZjc4ODEiLCJpZCI6ODU0MjMsImlhdCI6MTY0Njk4ODA1NX0.4-plF_5ZfEMMpHqJyefkDCFC8JWkFw39s3yKVcNg55c";
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
    100,
    30,
    110,
    40
  );
  let viewer = new Cesium.Viewer("mapContainer", {
    infoBox: false, //是否显示信息框
    selectionIndicator: false, //是否显示选取指示器组件
    timeline: false, //是否显示时间轴
    animation: false, //是否创建动画小器件，左下角仪表
    sceneModePicker: false,
    shouldAnimate: true,
    terrainProvider: Cesium.createWorldTerrain()
  });

  viewer.scene.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(108.8, 34.062, 2600),
    orientation: {
      heading: Cesium.Math.toRadians(150),
      pitch: Cesium.Math.toRadians(-30),
    },
  });

  window.ca = new CesiumAna(viewer)
});
</script>

<style>
.tbt {
  border: 1px solid blue;
  background: transparent;
  background-color: rgba(80,80,80, 0.7);
  border-radius: 2px;
  margin: 1px 2px;
  padding: 2px 8px;
  min-width: 90px;
  font-size: 14px;
  line-height: 16px;
  color: #00ff00;
}
</style>
