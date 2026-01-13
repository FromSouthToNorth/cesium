import { unref, toRaw } from 'vue'

import {
  GeoJsonDataSource,
  VerticalOrigin,
  LabelStyle,
  Color as CesiumColor,
  Cartesian2,
  PolylineGlowMaterialProperty
} from 'cesium'

import { useCesium } from '@/hooks/cesium/useCesium';
import { setupClustering } from './clustering';
import { createIconMarker } from './icon';

const viewer = () => {
  const { viewerRef } = useCesium();
  return toRaw(unref(viewerRef));
}

export function initPoint() {
  GeoJsonDataSource.load('/src/assets/geojson/mine.json', { clampToGround: false }).then(e => {
    console.log('矿井坐标加载完成: ', e);
    e.name = 'minePoint';
    viewer().dataSources.add(e).then(dataSource => {
      setupClustering(dataSource);
      dataSource.entities.values.map(point => {
        createIconMarker(point);
      })
    });
  })
  GeoJsonDataSource.load('/src/assets/geojson/jkyhmkDevicePoint.json', { clampToGround: false }).then(e => {
    console.log('矿井坐标加载完成: ', e);
    e.name = 'minePoint';
    viewer().dataSources.add(e).then(dataSource => {
      setupClustering(dataSource);
      dataSource.entities.values.map(point => {
        createIconMarker(point);
      })
    });
  })
}

export function initPolygon() {
  GeoJsonDataSource.load('/src/assets/geojson/mineBoundary.json', { clampToGround: true }).then(e => {
    console.log('矿井坐标加载完成: ', e);
    e.name = 'mineBoundary';
    viewer().dataSources.add(e);
  })
}

export function initTunnel() {
  GeoJsonDataSource.load('/src/assets/geojson/jkyhmkTunnel.json', { clampToGround: false }).then(e => {
    console.log('矿井巷道加载完成: ', e);
    e.name = 'mineTunnel';
    viewer().dataSources.add(e).then((dataSource) => {
      dataSource.entities.values.map(line => {
        line.polyline.material = new PolylineGlowMaterialProperty({
          color: CesiumColor.fromCssColorString(line.properties.color.getValue()),
        });
        line.polyline.width = 6;
      })
    })
    viewer().flyTo(e);
  })
}

