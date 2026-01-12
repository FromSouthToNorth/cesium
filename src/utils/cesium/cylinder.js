import { toRaw, unref } from 'vue'
import {
  Cartesian3,
  VerticalOrigin,
  Color as CesiumColor,
  LabelStyle,
  sampleTerrainMostDetailed,
  Cartographic,
  Cartesian2
} from 'cesium'

import { useCesium } from '@/hooks/cesium/useCesium';
import groundHole from '@/assets/geojson/jkyhmkGroundHole.json'
import { getTerrain } from './index'

const viewer = () => {
  const { viewerRef } = useCesium();
  return toRaw(unref(viewerRef));
}

let groundHoleEntities = []

function clearGroundHole() {
  const _viewer = viewer();
  groundHoleEntities.forEach(entity => {
    _viewer.entities.remove(entity)
  })
  groundHoleEntities = []
}

export function terrainGroundHole() {
  clearGroundHole();
  const { features } = groundHole;
  const positions = features.map(feature => {
    const { coordinates } = feature.geometry;
    return Cartographic.fromDegrees(coordinates[0], coordinates[1]);
  });
  const _viewer = viewer();
  const terrain = toRaw(unref(getTerrain));
  terrain.readyEvent.addEventListener(() => {
    const terr = sampleTerrainMostDetailed(_viewer.terrainProvider, positions)
    Promise.all([terr]).then(updatedPositions => {
      features.forEach((feature, index) => {
        const { properties: props, geometry } = feature
        const { coordinates: coord } = geometry;
        const height = updatedPositions[0][index].height;
        const totalDepth = props.depth || 500; // 终孔深度（米）
        const centerHeight = height - totalDepth / 2;
        const boreholeEntity = _viewer.entities.add({
          id: `borehole_${props.id}`,
          name: props.name || props.label,
          position: Cartesian3.fromDegrees(coord[0], coord[1], centerHeight),
          cylinder: {
            length: totalDepth,              // 总深度
            topRadius: 1.5,                  // 钻孔半径（可调整，单位米）
            bottomRadius: 1.5,
            material: CesiumColor.DIMGRAY.withAlpha(0.8), // 统一蓝色，可改成灰色/橙色等
            outline: true,
            outlineColor: CesiumColor.BLACK,
            outlineWidth: 2
          }
        });
        boreholeEntity.properties = props
        // 可选：添加地面标记（便于识别）
        const label = _viewer.entities.add({
          position: Cartesian3.fromDegrees(coord[0], coord[1], height + 5),
          billboard: {
            scale: 0.8,
            verticalOrigin: VerticalOrigin.BOTTOM
          },
          label: {
            text: props.label || props.name,
            font: '12px sans-serif',
            pixelOffset: new Cartesian2(0, -10),
            fillColor: CesiumColor.WHITE,
            outlineColor: CesiumColor.BLACK,
            outlineWidth: 6,
            style: LabelStyle.FILL_AND_OUTLINE
          }
        });
        label.properties = props;
        groundHoleEntities.push(boreholeEntity)
        groundHoleEntities.push(label)
      });
    });
  })
}
