import {
  Cartesian3,
  Ellipsoid, Transforms, HeadingPitchRoll, Ion,
  Model as CesiumModel,
  Math as CesiumMath, Viewer
} from 'cesium';
import 'cesium/Build/Widgets/widgets.css'
import './style/reset.css'
import './style/index.css'
import { truncatelongLat } from './utils/turf'

document.querySelector('#app').innerHTML = `
  <div id="cesiumInfo">
  经度: <span id='longitude'></span> °
  经度: <span id='latitude'></span> °
  高度: <span id="height"></span> 米
  航向: <span id="heading"></span> °
  俯仰: <span id="pitch"></span> °
  滚转: <span id="roll"></span> °
  </div>
`

// 初始化 Cesium Viewer
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA'
const viewer = new Viewer('app', {
  infoBox: false, // 禁用 InfoBox
  timeline: false,
  animation: false,
});

// 替换默认的 Home 按钮行为
viewer.homeButton.viewModel.command.afterExecute.addEventListener(() => {
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(104.0633, 30.66, 26000),
    orientation: {
      heading: CesiumMath.toRadians(0),
      pitch: CesiumMath.toRadians(-90),
      roll: 0.0
    },
    duration: 2 // 飞行时间（秒）
  });
});
getCesiumInfo()

viewer.camera.moveEnd.addEventListener(() => {
  console.log('moveEnd');
  getCesiumInfo()
});

function getCesiumInfo() {
  // 获取当前相机位置（弧度制）
  const cartographic = viewer.camera.positionCartographic;

  // 转换为经纬度（度）
  const longitude = CesiumMath.toDegrees(cartographic.longitude);
  const latitude = CesiumMath.toDegrees(cartographic.latitude);
  const height = Math.ceil(cartographic.height); // 相机高度（米）
  console.log("当前相机位置：", cartographic, viewer.camera.pitch);
  console.log("当前相机位置：", cartographic, viewer.camera.heading);
  console.log("当前相机位置：", cartographic, viewer.camera.roll);



  const longLat = truncatelongLat({ latitude, longitude })
  const camera = viewer.camera

  // 输出经纬度和高度
  document.querySelector('#longitude').textContent = longLat.longitude;
  document.querySelector('#latitude').textContent = longLat.latitude;
  document.querySelector('#height').textContent = height;
  document.querySelector('#pitch').textContent = CesiumMath.toDegrees(camera.pitch).toFixed(2);
  document.querySelector('#heading').textContent = CesiumMath.toDegrees(camera.heading).toFixed(2);
  document.querySelector('#roll').textContent = CesiumMath.toDegrees(camera.roll).toFixed(2);
}

async function loadModel() {
  try {
    // 定义模型位置（经度，纬度，高度）
    const position = Cartesian3.fromDegrees(104.0683, 30.667, 0);
    // 设置朝向（航向、俯仰、滚转）
    const headingPitchRoll = new HeadingPitchRoll(CesiumMath.toRadians(135), 0, 0);
    // 创建变换矩阵
    const modelMatrix = Transforms.headingPitchRollToFixedFrame(
      position,
      headingPitchRoll,
      Ellipsoid.WGS84
    );
    // 加载 GLB 模型
    const model = await CesiumModel.fromGltfAsync({
      url: '/glb/PSFS.glb', // 替换为你的 GLB 文件路径
      modelMatrix: modelMatrix,
      minimumPixelSize: 128, // 确保模型在远距离时可见
      maximumScale: 20000,
      scale: 1.0
    });
    // 将模型添加到场景
    viewer.scene.primitives.add(model);
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(104.068543, 30.6621182, 600),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-45),
      },
      duration: 5 // 飞行时间（秒）
    });
  } catch (error) {
    console.error(error);
  }
}

loadModel();
