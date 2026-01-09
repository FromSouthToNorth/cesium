import {
  ClippingPolygonCollection,
  ClippingPlaneCollection,
  Cartesian3,
  ClippingPolygon,
} from 'cesium'
import { unref, toRaw } from 'vue'

import { useCesiumStore } from '@/store/modules/cesiumStore'
import { polygon } from '@turf/turf';
const cesiumStore = useCesiumStore()

export function initClippingPolygons(origin) {
  const clippingPolygons = new ClippingPolygonCollection();
  origin.clippingPolygons = clippingPolygons;
  clipping();
}

function clipping() {
  const polygon = [
    [
      [
        112.386263,
        39.026519
      ],
      [
        112.397736,
        39.022734
      ],
      [
        112.420824,
        39.022455
      ],
      [
        112.420287,
        38.995436
      ],
      [
        112.397204,
        38.995719
      ],
      [
        112.397563,
        39.013727
      ],
      [
        112.381399,
        39.013921
      ],
      [
        112.380752,
        39.022216
      ],
      [
        112.386203,
        39.023412
      ],
      [
        112.386263,
        39.026519
      ]
    ]
  ];
  const viewer = toRaw(unref(cesiumStore.getViewer()));
  console.log(polygon);
  const positions = polygon[0].map(e => {
    return Cartesian3.fromDegrees(e[0], e[1])
  });
  const clipping = new ClippingPolygon({
    positions
  })
  viewer.scene.globe.clippingPolygons.add(clipping)
}
