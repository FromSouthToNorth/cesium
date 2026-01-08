import {
  GeoJsonDataSource
} from 'cesium'

import { unref, toRaw } from 'vue'

import { useCesiumStore } from '@/store/modules/cesiumStore'
const cesiumStore = useCesiumStore()
export function initPoint() {
  const viewer = toRaw(unref(cesiumStore.getViewer()))
  GeoJsonDataSource.load('/src/assets/geojson/mine.json', { clampToGround: false }).then(e => {
    console.log('矿井坐标加载完成！');
    e.name = 'minePoint'
    viewer.dataSources.add(e)
  })
}

export function initPolygon() {
  const viewer = toRaw(unref(cesiumStore.getViewer()))
  GeoJsonDataSource.load('/src/assets/geojson/mineBoundary.json', { clampToGround: true }).then(e => {
    console.log('矿井坐标加载完成！');
    e.name = 'mineBoundary'
    viewer.dataSources.add(e)
  })
}
