import { toRaw, unref } from 'vue'
import {
  ArcType,
  Cartesian3,
  VerticalOrigin,
  Color as CesiumColor,
  Math as CesiumMath,
  LabelStyle,
  sampleTerrainMostDetailed,
  Cartographic,
  Cartesian2,
  NearFarScalar,
  DistanceDisplayCondition,
  ColorMaterialProperty,
  CallbackProperty,
  HorizontalOrigin,
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
            style: LabelStyle.FILL_AND_OUTLINE,
            scaleByDistance: new NearFarScalar(2400, 1.2, 12000, 0.3), // 近处放大 1.5x，远处缩小到 0.3x
            translucencyByDistance: new NearFarScalar(5000, 1.0, 15000, 0.0), // 2000m 内全不透，8000m 完全透明
            distanceDisplayCondition: new DistanceDisplayCondition(0, 15000),
          }
        });
        label.properties = props;
        groundHoleEntities.push(boreholeEntity);
        groundHoleEntities.push(label);
        intervalScale(coord, height, totalDepth);
      });
    });
  })
}

function intervalScaleLabel(coord, height) {
  const _viewer = viewer();
  // 添加高度标签（放在右侧或左侧）
  const label = _viewer.entities.add({
    position: coord,
    label: {
      text: `${height} m`,
      font: '10px sans-serif',
      fillColor: CesiumColor.WHITE,
      outlineColor: CesiumColor.DIMGRAY,
      outlineWidth: 2,
      style: LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: VerticalOrigin.CENTER,
      horizontalOrigin: HorizontalOrigin.LEFT,
      eyeOffset: new Cartesian3(0, 0, -6),
      scaleByDistance: new NearFarScalar(1200, 1.2, 6000, 0.3), // 近处放大 1.5x，远处缩小到 0.3x
      translucencyByDistance: new NearFarScalar(2000, 1.0, 8000, 0.0), // 2000m 内全不透，8000m 完全透明
      distanceDisplayCondition: new DistanceDisplayCondition(0, 10000),
    }
  });
  groundHoleEntities.push(label);
}

function intervalScaleLine(leftPos, rightPos) {
  const _viewer = viewer();
  // 添加水平刻度线（Polyline）
  const line = _viewer.entities.add({
    polyline: {
      positions: [leftPos, rightPos],
      width: 3,
      material: new ColorMaterialProperty(
        new CallbackProperty(() => {
          const dist = Cartesian3.distance(_viewer.camera.position, rightPos);
          const alpha = CesiumMath.clamp(1 - (dist - 800) / 3500, 0, 1);
          return new CesiumColor(105, 105, 105, alpha); // 远距离渐隐
        }, false)
      ),
      arcType: ArcType.NONE
    }
  });
  groundHoleEntities.push(line);
}


/**
 * 
 * @param {*} coord 中心点
 * @param {*} height 海拔高度
 * @param {*} totalDepth 深度
 */
function intervalScale(coord, height, totalDepth) {
  const _viewer = viewer();
  const interval = 20;
  const WEST_OFFSET = 0.00001;  // 向西偏移量
  const EAST_OFFSET = 0.0001;   // 向东偏移量
  // 创建坐标点的辅助函数
  const createPosition = (longitudeOffset, altitude) => {
    return Cartesian3.fromDegrees(
      coord[0] + longitudeOffset,
      coord[1],
      altitude
    );
  };

  for (let h = interval; h <= totalDepth - interval; h += interval) {
    const currentHeight = height - h;
    const leftPos = createPosition(WEST_OFFSET, currentHeight);
    const rightPos = createPosition(EAST_OFFSET, currentHeight);
    intervalScaleLine(leftPos, rightPos);
    intervalScaleLabel(rightPos, h);
  }
  // 处理最后一个点（totalDepth处）
  const finalHeight = height - totalDepth;
  const leftPos = createPosition(WEST_OFFSET, finalHeight);
  const rightPos = createPosition(EAST_OFFSET, finalHeight);
  intervalScaleLine(leftPos, rightPos);
  intervalScaleLabel(rightPos, totalDepth);
}
