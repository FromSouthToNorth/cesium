import { unref, toRaw } from 'vue'

import {
  Material,
  buildModuleUrl,
  GeoJsonDataSource,
  Color as CesiumColor,
  ImageMaterialProperty,
  Cartesian2,
  Primitive,
  PolygonGeometry,
  GeometryInstance,
  EllipsoidSurfaceAppearance,
  Cartographic,
  Math as CesiumMath,
  Cartesian3,
  LabelStyle,
  HorizontalOrigin,
  VerticalOrigin,
  NearFarScalar,
  DistanceDisplayCondition
} from 'cesium';

import {
  turfCentroid,
  turfPolygon,
} from '@/utils/turf';

import { buildLabel } from './icon'

import { useCesium } from '@/hooks/cesium/useCesium';

import jkyhmkStagnant from '@/assets/geojson/jkyhmkStagnant.json';

const viewer = () => {
  const { viewerRef } = useCesium();
  return toRaw(unref(viewerRef));
}

function debugCoordinates(geojson) {
  geojson.features.forEach((f, idx) => {
    console.log(`Feature ${idx}: ${f.properties?.name || '无名'}`);
    const coords = f.geometry?.coordinates || [];
    coords.flat(2).forEach((val, i) => {
      if (i % 3 === 0 && typeof val !== 'number') {  // 每组的第一个（经度）
        console.error(`坏经度在 Feature ${idx} 的位置 ${i / 3}:`, val);
      }
    });
  });
}

let waters = []
let waterLabels = []

export function clearWater() {
  waters.forEach(water => {
    viewer().scene.primitives.remove(water);
  });
  waters = [];
}

// 给 waterPrimitive 增加名称
export function water() {
  GeoJsonDataSource.load('/src/assets/geojson/jkyhmkStagnant.json').then((dataSource) => {
    clearWater();
    dataSource.entities.values.map((e, index) => {
      const positions = e.polygon.hierarchy.getValue().positions.map((position) => {
        const cartographic = Cartographic.fromCartesian(position);
        return [
          CesiumMath.toDegrees(cartographic.longitude),
          CesiumMath.toDegrees(cartographic.latitude)
        ]
      })

      const { water: height, lower, name } = e.properties.getValue();
      const waterPrimitive = new Primitive({
        geometryInstances: new GeometryInstance({
          geometry: new PolygonGeometry({
            height: lower,
            // extrudedHeight: lower,
            polygonHierarchy: e.polygon.hierarchy.getValue()
          }),
        }),
        appearance: new EllipsoidSurfaceAppearance({
          material: new Material({
            fabric: {
              type: 'Water',
              uniforms: {
                normalMap: buildModuleUrl('Assets/Textures/waterNormals.jpg'),
                frequency: 1000,
                animationSpeed: 0.01,
                amplitude: 10
              }
            }
          })
        })
      });
      waterPrimitive.properties = e.properties.getValue();
      const center = turfCentroid(turfPolygon([positions]));
      const p = Cartesian3.fromDegrees(center[0], center[1], lower);
      waterPrimitive.center = p;
      waters.push(waterPrimitive);
      viewer().scene.primitives.add(waterPrimitive);
      const label = viewer().entities.add({
        position: p,
        label: {
          text: name,
          font: 'bold 12px Microsoft YaHei, sans-serif', // 中文友好字体
          fillColor: CesiumColor.WHITE,
          outlineColor: CesiumColor.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          horizontalOrigin: HorizontalOrigin.CENTER,
          verticalOrigin: VerticalOrigin.BOTTOM, // 文字底部对齐中心点
          pixelOffset: new Cartesian2(0, -10),   // 屏幕像素微调
          eyeOffset: new Cartesian3(0, 0, -500), // 负 z 方向（向“镜头”方向）抬高 500 米
          scaleByDistance: new NearFarScalar(1000, 1.2, 500000, 0.6), // 远近缩放
          distanceDisplayCondition: new DistanceDisplayCondition(0, 500000) // 可见范围
        }
      });
      label.properties = e.properties.getValue();
      waters.push(label);
    });
  });
}
