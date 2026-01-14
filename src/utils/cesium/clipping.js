import {
  ClippingPolygonCollection,
  ClippingPlaneCollection,
  Cartesian2,
  Cartesian3,
  ClippingPolygon,
  sampleTerrainMostDetailed,
  Cartographic,
  ImageMaterialProperty
} from 'cesium'
import { unref, toRaw } from 'vue';

import { useCesium } from '@/hooks/cesium/useCesium';
import { getTerrain } from './';
import { turfConcave, turfPolygon, turfUnion, densifyPolygon } from '../turf';
import tunnelGeojson from '@/assets/geojson/jkyhmkTunnel.json'

const CONSTANTS = {
  TEXTURE_PATH_1: '/src/assets/soil_texture.png',
  TEXTURE_PATH_2: '/src/assets/soil_texture2.png',
  TERRAIN_REPEAT: new Cartesian2(80, 80)
}

const viewer = () => {
  const { viewerRef } = useCesium();
  return toRaw(unref(viewerRef));
}

export function initClippingPolygons() {
  const _viewer = viewer();
  const clippingPolygons = new ClippingPolygonCollection();
  _viewer.scene.globe.clippingPolygons = clippingPolygons;
  clipping();
}

const polygon = [
  [
    [
      116.523367,
      35.503867
    ],
    [
      116.511621,
      35.499683
    ],
    [
      116.498727,
      35.503037
    ],
    [
      116.497985,
      35.498894
    ],
    [
      116.493044,
      35.497119
    ],
    [
      116.491275,
      35.493206
    ],
    [
      116.490751,
      35.484996
    ],
    [
      116.484847,
      35.477154
    ],
    [
      116.489239,
      35.476554
    ],
    [
      116.500509,
      35.477377
    ],
    [
      116.500647,
      35.465978
    ],
    [
      116.527711,
      35.466075
    ],
    [
      116.530490,
      35.471462
    ],
    [
      116.531203,
      35.481550
    ],
    [
      116.526446,
      35.488341
    ],
    [
      116.529533,
      35.495924
    ],
    [
      116.524893,
      35.498076
    ],
    [
      116.523367,
      35.503867
    ]
  ]
];

function clipping() {
  const tunnelPolygon = turfConcave(tunnelGeojson);
  console.log('tunnelPolygon: ', tunnelPolygon);
  const mineBoundary = densifyPolygon(turfUnion(tunnelPolygon, turfPolygon(polygon)), 70).geometry.coordinates;
  console.log('mineBoundary: ', mineBoundary);
  const positions = mineBoundary[0].map(e => Cartesian3.fromDegrees(e[0], e[1]));
  const clipping = new ClippingPolygon({
    positions
  });
  viewer().scene.globe.clippingPolygons.add(clipping);
  wall(positions);
}

let walls = []

function wall(positions) {
  console.log('positions: ', positions);
  const _viewer = viewer();
  const terrain = toRaw(unref(getTerrain));
  const cartographic = positions.map((position) => Cartographic.fromCartesian(position))

  terrain.readyEvent.addEventListener(() => {
    const pr = sampleTerrainMostDetailed(_viewer.terrainProvider, cartographic)
    Promise.all([pr]).then(updatedPositions => {
      console.log('updatedPositions: ', updatedPositions);
      // 添加墙体
      const wall1 = _viewer.entities.add({
        wall: {
          positions: positions,
          minimumHeights: updatedPositions[0].map(p => p.height),
          maximumHeights: new Array(positions.length).fill(-1000),
          material: new ImageMaterialProperty({
            image: CONSTANTS.TEXTURE_PATH_1,
            repeat: CONSTANTS.TERRAIN_REPEAT,
          })
        }
      })
      walls.push(wall1)

      // 添加多边形
      const wall2 = _viewer.entities.add({
        polygon: {
          hierarchy: positions,
          material: new ImageMaterialProperty({
            image: CONSTANTS.TEXTURE_PATH_2,
            repeat: CONSTANTS.TERRAIN_REPEAT,
          }),
          height: -1000,
        },
      });
      walls.push(wall2)
    });
  });
}
