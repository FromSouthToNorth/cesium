import { ref, toRaw, unref, computed } from 'vue';

import {
  Viewer,
  Ion,
  Terrain,
  ClippingPolygonCollection,
  Cesium3DTileset,
  UrlTemplateImageryProvider,
  WebMercatorTilingScheme,
  ImageryLayer,
  Rectangle,
  Credit,
  Camera,
  defined,
  Cartographic,
  Math as CesiumMath,
  ScreenSpaceEventType,
  Model,
  Cartesian3,
} from 'cesium'

import CesiumNavigation from 'cesium-navigation-es6';

import { useCesiumStore } from '@/store/modules/cesiumStore';
import { setUrlTemplateImageryProvider, flyToCine } from './tileImage';
import { useSetting } from '@/hooks/setting/useSetting'
import { initPoint, initPolygon, initTunnel } from './geojson'
import { initModel } from './model'
import { initClippingPolygons } from './clipping'
import { terrainGroundHole } from './cylinder'
import { water } from './water'
export { translateModel } from './model'
export { createIconMarker } from './icon'

const { setPageLoading } = useSetting()

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA';

const viewerRef = ref(null);
const terrainRef = ref(null);
const activeEntityRef = ref(null);
const cesiumStore = useCesiumStore();

export const getActiveEntity = computed(() => unref(activeEntityRef));
export const getTerrain = computed(() => unref(terrainRef));

export function initializeCesium(refEl) {
  setPageLoading(true);
  viewerRef.value = new Viewer(refEl, {
    // infoBox: false,
    timeline: false,
    animation: false,
    shouldAnimate: true, // Enable animations
    baseLayerPicker: false
  });
  const viewer = toRaw(unref(viewerRef))
  // setUrlTemplateImageryProvider(viewer)
  new CesiumNavigation(viewer)
  const scene = viewer.scene;
  const globe = scene.globe;
  globe.clippingPolygons = new ClippingPolygonCollection();
  globe.translucency.enabled = true
  scene.globe.depthTestAgainstTerrain = true;
  terrainRef.value = Terrain.fromWorldTerrain();
  scene.setTerrain(toRaw(unref(terrainRef)));

  cesiumStore.setViewer(viewerRef)
  const destination = Rectangle.fromDegrees(73, 18, 135, 53);
  Camera.DEFAULT_VIEW_RECTANGLE = destination;
  initClippingPolygons();
  // flyToCine(viewer, destination, () => {
  // });
  onLeftClick(viewer);
  onRightClick(viewer)
  initPoint()
  initPolygon()
  initTunnel()
  setPageLoading(false);
  terrainGroundHole();
  water();
  initModel([
    116.5132,
    35.48655,
    0
  ], 'ModelTunnel');
  return viewer;
}

function onLeftClick(viewer) {
  const scene = viewer.scene;
  const globe = scene.globe;
  viewer.screenSpaceEventHandler.setInputAction((event) => {
    const pickedObject = scene.pick(event.position);
    if (defined(pickedObject)) {
      const obj = pickedObject.id || pickedObject.primitive;
      const position = obj.position ? obj.position.getValue() : scene.pickPosition(event.position);
      activeEntityRef.value = { obj: obj, type: 'object', position };
    } else {
      console.log('pickedObject: ', pickedObject);
      // const cartesian = viewer.camera.pickEllipsoid(position, globe.ellipsoid);
      // if (cartesian) {
      //   const cartographic = Cartographic.fromCartesian(cartesian);
      //   const longitude = CesiumMath.toDegrees(cartographic.longitude);
      //   const latitude = CesiumMath.toDegrees(cartographic.latitude);
      //   activeEntityRef.value = { position: cartesian, longitude, latitude, type: 'cartographic' };
      // }
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
}

function onRightClick(viewer) {
  const scene = viewer.scene;
  const globe = scene.globe;
  viewer.screenSpaceEventHandler.setInputAction((event) => {
    const pickedObject = scene.pick(event.position);
    const position = viewer.scene.pickPosition(event.position)
    if (!defined(pickedObject)) {
      activeEntityRef.value = {}
      return;
    }
    console.log('Picked object: ', pickedObject);
    const { primitive } = pickedObject
    if (primitive instanceof Model) {
      activeEntityRef.value = { obj: primitive, type: 'model' };
    }
    else {
      activeEntityRef.value = {}
    }
  }, ScreenSpaceEventType.RIGHT_CLICK);
}

export function destroyCesium(app) {
  const viewer = toRaw(unref(viewerRef))
  console.log('viewer: ', viewer);

  if (!viewer) return

  // 防止重复销毁
  if (viewer.isDestroyed?.()) {
    viewerRef.value = null
    return
  }

  try {
    // 1. 核心销毁
    viewer.isDestroyed() || viewer.destroy()
  } catch (e) {
    console.warn('Cesium destroy 过程出现异常:', e)
  } finally {
    viewerRef.value = null
    console.log('Cesium Viewer destroyed')
  }
}

/**
 * 计算折线的几何中心点
 * @param {Array} positions - 折线顶点数组，每个元素为Cartesian3类型的坐标点
 * @param {number} [heightOffset=2] - 高度偏移量，默认为2米，用于将中心点抬高到地面以上
 * @returns {Cartesian3|undefined} 返回折线的几何中心点坐标，如果输入无效则返回undefined
 */
export function getPolylineGeometricCenter(positions, heightOffset = 2) {
  if (!positions || positions.length === 0) return undefined;

  const sum = new Cartesian3(0, 0, 0);
  let count = 0;

  for (const pos of positions) {
    Cartesian3.add(sum, pos, sum);
    count++;
  }

  const center = Cartesian3.divideByScalar(sum, count, new Cartesian3());

  // 抬高（最常见做法）
  if (heightOffset !== 0) {
    const carto = Cartographic.fromCartesian(center);
    carto.height += heightOffset;
    return Cartographic.toCartesian(carto);
  }

  return center;
}
