import {
  convex,
  concave,
  explode,
  union,
  featureCollection,
  polygon as Polygon,
  centroid,
} from '@turf/turf'

import { isArray } from './is';


export function turfExplode(geojson) {
  return explode(geojson);
}

export function turfConcave(geojson) {
  const points = turfExplode(geojson);
  return concave(points);
}

export function turfConvex(geojson) {
  return convex(geojson);
}

export function turfUnion(a, b) {
  return union(featureCollection([a, b]))
}

export function turfPolygon(positions) {
  return Polygon(positions)
}

/**
 * 在每条边上均匀插入指定数量的点（不改变形状）
 * @param {Feature<Polygon|MultiPolygon>} polygon
 * @param {number} pointsPerEdge 每条边插入的点数（不含原有端点）
 * @returns {Feature<Polygon|MultiPolygon>}
 */
export function densifyPolygon(polygon, pointsPerEdge = 5) {
  const densifyRing = (ring) => {
    const newRing = [];

    for (let i = 0; i < ring.length - 1; i++) {
      const start = ring[i];
      const end = ring[i + 1];

      newRing.push(start);

      // 在起点和终点之间插入 pointsPerEdge 个点
      for (let j = 1; j <= pointsPerEdge; j++) {
        const t = j / (pointsPerEdge + 1);
        const x = start[0] + (end[0] - start[0]) * t;
        const y = start[1] + (end[1] - start[1]) * t;
        newRing.push([x, y]);
      }
    }

    // 闭合环
    newRing.push(ring[ring.length - 1]);
    return newRing;
  };

  const newCoords = polygon.geometry.coordinates.map(ringOrRings => {
    // Polygon: 只有一个环数组
    // MultiPolygon: 多个环数组
    if (isArray(ringOrRings[0][0])) {
      // MultiPolygon
      return ringOrRings.map(densifyRing);
    } else {
      // Polygon
      return densifyRing(ringOrRings);
    }
  });
  console.log(newCoords);
  return Polygon([newCoords[0]], polygon.properties); // 简化处理，实际根据类型返回
  // 如果是 MultiPolygon 则：turf.multiPolygon(newCoords, polygon.properties)
}


export function turfCentroid(geojson) {
  const cent = centroid(geojson);
  return cent.geometry.coordinates;
}
