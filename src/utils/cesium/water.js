import { unref, toRaw } from 'vue'

import {
  Material,
  buildModuleUrl,
  GeoJsonDataSource
} from 'cesium'

import { useCesium } from '@/hooks/cesium/useCesium';

import jkyhmkStagnant from '@/assets/geojson/jkyhmkStagnant.json'

const viewer = () => {
  const { viewerRef } = useCesium();
  return toRaw(unref(viewerRef));
}


const waterMaterial = new Material({
  fabric: {
    type: 'Water',
    uniforms: {
      normalMap: buildModuleUrl('/src/assets/waterNormalsSmall.jpg'), // 或你自己的法线图
      frequency: 1000.0,          // 波纹频率
      animationSpeed: 0.01,       // 波动速度
      amplitude: 5.0              // 波幅
    }
  }
});

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
  console.log('jkyhmkStagnant: ', jkyhmkStagnant);
  const { features } = jkyhmkStagnant
  GeoJsonDataSource.load('/src/assets/geojson/jkyhmkStagnant.json').then((e) => {
    console.log('water: ', e);
    viewer().dataSources.add(e).then((dataSource) => {
      console.log('dataSource: ', dataSource);
    })
  })
}
