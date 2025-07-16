import './reset.css'
import './style.css'
import 'cesium/Source/Widgets/widgets.css'
import * as Cesium from 'cesium'
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer } from 'cesium';


try {
  // 初始化 Cesium Viewer
  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA'
  const viewer = new Viewer('app', {
    infoBox: false, // 禁用 InfoBox
  });
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(104.063981, 30.659599, 600),
    orientation: {
      heading: CesiumMath.toRadians(0.0),
      pitch: CesiumMath.toRadians(-15.0),
    }
  });
} catch (error) {
  console.log(error)
}
