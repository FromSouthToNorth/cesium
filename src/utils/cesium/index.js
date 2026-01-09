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
  ScreenSpaceEventType
} from 'cesium'
import CesiumNavigation from 'cesium-navigation-es6';

import { useCesiumStore } from '@/store/modules/cesiumStore';
import { setUrlTemplateImageryProvider, flyToCine } from './tileImage';
import { useSetting } from '@/hooks/setting/useSetting'
import { initPoint, initPolygon, initTunnel } from './geojson'
import { initModel } from './model'
import { initClippingPolygons } from './clipping'

const { setPageLoading } = useSetting()

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA';

const viewerRef = ref(null);
const activeEntityRef = ref(null);
const cesiumStore = useCesiumStore();

export const getActiveEntity = computed(() => unref(activeEntityRef));

export function initializeCesium(refEl) {
  setPageLoading(true);
  viewerRef.value = new Viewer(refEl, {
    // infoBox: false,
    timeline: false,
    animation: false,
    shouldAnimate: true, // Enable animations
    baseLayerPicker: false,
  });
  const viewer = toRaw(unref(viewerRef))
  // setUrlTemplateImageryProvider(viewer)
  new CesiumNavigation(viewer)
  const scene = viewer.scene;
  const globe = scene.globe;
  globe.clippingPolygons = new ClippingPolygonCollection();
  globe.translucency.enabled = true
  const terrain = Terrain.fromWorldTerrain();
  scene.setTerrain(terrain);
  cesiumStore.setViewer(viewerRef)
  const destination = Rectangle.fromDegrees(73, 18, 135, 53);
  Camera.DEFAULT_VIEW_RECTANGLE = destination;
  initClippingPolygons(viewer.scene.globe);
  // flyToCine(viewer, destination, () => {
  // });
  onLeftClick(viewer);
  initPoint()
  initPolygon()
  initTunnel()
  setPageLoading(false);
  initModel([
    112.384,
    39.0157,
    1556.63
  ], 'ModelTunnel');
  return viewer;
}

function onLeftClick(viewer) {
  console.log('viewer: ', viewer);
  const scene = viewer.scene;
  const globe = scene.globe;
  viewer.screenSpaceEventHandler.setInputAction((event) => {
    const { position } = event;
    const pickedObject = scene.pick(position);
    if (defined(pickedObject)) {
      console.log('Picked object: ', pickedObject);
      activeEntityRef.value = { ...pickedObject, type: 'object' };
    } else {
      const cartesian = viewer.camera.pickEllipsoid(position, globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cartographic.fromCartesian(cartesian);
        const longitude = CesiumMath.toDegrees(cartographic.longitude);
        const latitude = CesiumMath.toDegrees(cartographic.latitude);
        activeEntityRef.value = { position: cartesian, longitude, latitude, type: 'cartographic' };
      }
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
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
    // 1. 停止所有渲染/事件循环（非常重要！）
    viewer.isDestroyed() || viewer.scene.preUpdate.removeEventListener(() => { })
    viewer.isDestroyed() || viewer.scene.postUpdate.removeEventListener(() => { })
    viewer.isDestroyed() || viewer.scene.preRender.removeEventListener(() => { })
    viewer.isDestroyed() || viewer.scene.postRender.removeEventListener(() => { })

    // 2. 清空各种集合（带 destroy 选项）
    viewer.entities && viewer.entities.removeAll()
    viewer.dataSources && viewer.dataSources.removeAll({ destroy: true })
    viewer.imageryLayers && viewer.imageryLayers.removeAll()
    viewer.scene.primitives && viewer.scene.primitives.removeAll()

    // 3. 特别处理 3D Tileset（最容易泄漏）
    if (viewer.scene.primitives) {
      const primitives = viewer.scene.primitives
      for (let i = primitives.length - 1; i >= 0; i--) {
        const p = primitives.get(i)
        if (p instanceof Cesium3DTileset) {
          p.isDestroyed() || p.destroy()
        }
      }
    }

    // 4. 销毁事件处理器（自定义的要特别注意）
    // viewer.screenSpaceEventHandler?.destroy()

    // 5. 核心销毁
    viewer.isDestroyed() || viewer.destroy()
  } catch (e) {
    console.warn('Cesium destroy 过程出现异常:', e)
  } finally {
    viewerRef.value = null
    console.log('Cesium Viewer destroyed')
  }
}
