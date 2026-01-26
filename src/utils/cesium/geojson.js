import { unref, toRaw } from 'vue'

import {
  GeoJsonDataSource,
  VerticalOrigin,
  LabelStyle,
  Color as CesiumColor,
  Cartesian2,
  Cartesian3,
  PolylineGlowMaterialProperty,
  PolylineArrowMaterialProperty,
  HorizontalOrigin,
  NearFarScalar,
  DistanceDisplayCondition,
} from 'cesium'

import { useCesium } from '@/hooks/cesium/useCesium';
import { setupClustering } from './clustering';
import { createIconMarker } from './icon';

import { getPolylineGeometricCenter } from './index'

const viewer = () => {
  const { viewerRef } = useCesium();
  return toRaw(unref(viewerRef));
}

const labelMap = new Map()

function clearDataSource(name) {
  const _viewer = viewer();
  const sor = _viewer.dataSources._dataSources.filter(dataSource => dataSource.name === name);
  sor.forEach(data => {
    _viewer.dataSources.remove(data);
  });
  const labels = labelMap.get(name);
  labels && labels.forEach(label => {
    _viewer.entities.remove(label);
  });
}


export function initPoint() {
  GeoJsonDataSource.load('/src/assets/geojson/mine.json', { clampToGround: false }).then(e => {
    console.log('矿井坐标加载完成: ', e);
    e.name = 'minePoint';
    viewer().dataSources.add(e).then(dataSource => {
      setupClustering(dataSource);
      dataSource.entities.values.map(point => {
        createIconMarker(point, e.name);
      })
    });
  })
  GeoJsonDataSource.load('/src/assets/geojson/jkyhmkDevicePoint.json', { clampToGround: false }).then(e => {
    console.log('矿井坐标加载完成: ', e);
    e.name = 'devicePoint';
    viewer().dataSources.add(e).then(dataSource => {
      dataSource.entities.values.map(point => {
        createIconMarker(point, e.name);
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

function setLineColor(line) {
  const { color, width } = line.properties.getValue();
  const _color = CesiumColor.fromCssColorString(color);
  line.polyline.material = new PolylineArrowMaterialProperty(_color);
  line.polyline.width = width ?? 12;
}

/**
 * 设置线名称并在线的几何中心位置添加高度标签
 * @param {string} name - 线的名称标识
 * @param {Object} line - 包含polyline对象的线数据
 * @returns {void}
 */
function setLineName(name, line) {
  const properties = line.properties.getValue ? line.properties.getValue() : line.properties;
  const { tunnelName } = properties
  if (tunnelName) {
    const _viewer = viewer();
    const position = getPolylineGeometricCenter(line.polyline.positions.getValue());
    const label = _viewer.entities.add({
      position: position,
      label: {
        text: tunnelName,
        font: '12px sans-serif',
        fillColor: CesiumColor.WHITE,
        outlineColor: CesiumColor.DIMGRAY,
        outlineWidth: 2,
        style: LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: VerticalOrigin.CENTER,
        horizontalOrigin: HorizontalOrigin.CENTER,
        eyeOffset: new Cartesian3(0, 0, -40),
        scaleByDistance: new NearFarScalar(1200, 1.2, 6000, 0.8), // 近处放大 1.5x，远处缩小到 0.3x
        translucencyByDistance: new NearFarScalar(2000, 1.0, 8000, 0.6), // 2000m 内全不透，8000m 完全透明
        distanceDisplayCondition: new DistanceDisplayCondition(0, 10000),
      }
    });
    const labels = labelMap.get(name);
    if (labels) {
      labels.push(label)
    }
    else {
      labelMap.set(name, [label])
    }
  }
}

export function initTunnel() {
  GeoJsonDataSource.load('/src/assets/geojson/jkyhmkTunnel.json', { clampToGround: false }).then(e => {
    console.log('矿井巷道加载完成: ', e);
    e.name = 'mineTunnel';
    viewer().dataSources.add(e).then((dataSource) => {
      dataSource.entities.values.map(line => {
        setLineColor(line);
        setLineName('jkyhmkTunnel', line);
      })
    })
    viewer().flyTo(e);
  })
}

