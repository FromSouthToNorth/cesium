import './reset.css'
import './style.css'
import 'cesium/Source/Widgets/widgets.css'
import * as Cesium from 'cesium'


try { 
  // 初始化 Cesium Viewer
  Cesium.Ion.defaultAccessToken ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA'
  const viewer = new Cesium.Viewer('app', {
    infoBox: false, // 禁用 InfoBox
  });   
} catch (error) {
  console.log(error)
}
