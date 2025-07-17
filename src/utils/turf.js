import * as turf from '@turf/turf';

export function getCoord(point) {
  return turf.getCoord(point);
}

export function truncate(longLat, precision = 7, coordinates = 3) {
  const point = turf.truncate(turf.point([longLat.longitude, longLat.latitude]), { precision, coordinates })
  return point
}

export function truncatelongLat(longLat, precision = 7, coordinates = 3) {
  const point = truncate(longLat, precision, coordinates)
  const coord = getCoord(point)
  return {
    latitude: coord[1],
    longitude: coord[0],
  }
}
