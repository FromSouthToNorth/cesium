import { unref, toRaw } from 'vue'

import {
  Material,
  buildModuleUrl,
  GeoJsonDataSource,
  Color as CesiumColor,
  ImageMaterialProperty,
  Cartesian2,
} from 'cesium'

import { useCesium } from '@/hooks/cesium/useCesium';

import jkyhmkStagnant from '@/assets/geojson/jkyhmkStagnant.json'

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

export function water() {
  GeoJsonDataSource.load('/src/assets/geojson/jkyhmkStagnant.json', {
    stroke: CesiumColor.BLUE.withAlpha(0.2)
  }).then((e) => {
    viewer().dataSources.add(e).then((dataSource) => {
      console.log('dataSource: ', dataSource);
      dataSource.entities.values.forEach((entity) => {
        entity.polygon.material = new ImageMaterialProperty({
          image: buildModuleUrl('Assets/Textures/waterNormals.jpg'), // 或你自己的水纹循环图
          transparent: true,
          colorToAlpha: CesiumColor.WHITE,
          repeat: new Cartesian2(10.0, 10.0) // 控制密度
        });
      })
    })
  })
}
