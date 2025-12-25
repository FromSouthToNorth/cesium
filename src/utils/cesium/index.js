import { ref, toRaw, unref } from 'vue';

import {
  Viewer,
  Ion,
  Terrain,
  ClippingPolygonCollection,
  Cesium3DTileset,
  UrlTemplateImageryProvider,
  WebMercatorTilingScheme,
  ImageryLayer,
  Credit
} from 'cesium'
import CesiumNavigation from 'cesium-navigation-es6';

import { useCesiumStore } from '@/store/modules/cesiumStore';
import { setUrlTemplateImageryProvider } from './tileImage';

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA';

const viewerRef = ref(null);
const cesiumStore = useCesiumStore();
export function initializeCesium(refEl) {
  viewerRef.value = new Viewer(refEl, {
    // infoBox: false,
    timeline: false,
    animation: false,
    shouldAnimate: true, // Enable animations
    baseLayerPicker: false,
  })
  const viewer = toRaw(unref(viewerRef))
  setUrlTemplateImageryProvider(viewer)
  new CesiumNavigation(viewer)
  const scene = viewer.scene;
  const globe = scene.globe;
  globe.clippingPolygons = new ClippingPolygonCollection();
  globe.translucency.enabled = true
  // const terrain = Terrain.fromWorldTerrain();
  // scene.setTerrain(terrain);

  cesiumStore.setViewer(viewerRef)
  return viewerRef;
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

    // 6. 最后暴力手段 - 缩小 canvas 尺寸，强制浏览器回收 WebGL Context
    // （很多项目实测这一步最有效释放显存）
    const canvas = viewer.canvas
    if (canvas) {
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
      if (gl) {
        gl.canvas.width = 1
        gl.canvas.height = 1
      }
    }
  } catch (e) {
    console.warn('Cesium destroy 过程出现异常:', e)
  } finally {
    viewerRef.value = null
    console.log('Cesium Viewer destroyed')
  }
}
