import {
  Color as CesiumColor,
  buildModuleUrl,
  PinBuilder,
  Cartesian2,
  LabelStyle,
  HeightReference,
  NearFarScalar,
  DistanceDisplayCondition
} from 'cesium';

const ICON_URL = '/src/assets/markerIcon/ICON.svg';
const DEFAULT_ICON_SIZE = 36;
const DEFAULT_COLOR = 'WHITE';
const DEFAULT_NAME = '';
const LABEL_OFFSET = new Cartesian2(0, -56);
const BACKGROUND_PADDING = new Cartesian2(8, 6);

/**
 * 替换图标URL中的占位符
 * @param {string} icon - 图标名称
 * @returns {string} 替换后的URL
 */
function replaceIcon(icon) {
  return ICON_URL.replace('ICON', icon);
}

/**
 * 获取标记图标URL
 * @param {string} key - 图标键
 * @returns {string} 图标URL
 */
function getMarkerIcon(key) {
  return replaceIcon(key);
}

/**
 * 创建图标标记
 * @param {Object} entity - 实体对象
 * @returns {Promise<void>}
 */
export async function createIconMarker(entity, key) {
  try {
    // 验证实体对象
    if (!entity || !entity.properties) {
      console.warn('Invalid entity or missing properties');
      return;
    }

    const properties = entity.properties.getValue();

    // 验证属性对象
    if (!properties) {
      console.warn('Entity properties is null or undefined');
      return;
    }
    const { color, icon, name, label } = properties;
    const _label = label || name;

    // 验证颜色值
    const validColor = validateColor(color);


    const pinBuilder = new PinBuilder();

    try {
      entity.billboard = entity.billboard || {};
      if (icon) {
        const iconURL = getMarkerIcon(icon);
        const result = await pinBuilder.fromUrl(iconURL, validColor, DEFAULT_ICON_SIZE);
        entity.billboard.image = result.toDataURL();
      }
      entity.label = buildLabel(_label || DEFAULT_NAME, key);
    } catch (error) {
      console.error('Failed to create icon from URL:', error);
    }
  } catch (error) {
    console.error('Error in createIconMarker:', error);
  }
}

/**
 * 验证颜色值，返回有效颜色或默认颜色
 * @param {string} color - 颜色名称
 * @returns {Object} Cesium颜色对象
 */
function validateColor(color) {
  if (!color || !CesiumColor[color]) {
    console.warn(`Invalid color: ${color}, using default color: ${DEFAULT_COLOR}`);
    return CesiumColor[DEFAULT_COLOR];
  }
  return CesiumColor[color];
}

/**
 * 构建标签配置
 * @param {string} mineName - 矿山名称
 * @returns {Object} 标签配置对象
 */
export function buildLabel(name, key) {
  // 参数验证
  if (typeof name !== 'string' && name != null) {
    throw new TypeError('name must be a string or null/undefined');
  }
  if (typeof key !== 'string') {
    throw new TypeError('key must be a string');
  }

  // 基础配置
  const baseConfig = {
    text: name || DEFAULT_NAME,
    font: 'bold 12px Microsoft YaHei, sans-serif',
    pixelOffset: new Cartesian2(0, -48),
    fillColor: CesiumColor.WHITE,
    outlineColor: CesiumColor.BLACK,
    outlineWidth: 6,
    // 以下三行让文字永远在最前面 + 带黑底，超级清晰
    style: LabelStyle.FILL_AND_OUTLINE
  };

  if (key !== 'minePoint') {
    // 非MinePoint类型的额外配置
    return {
      ...baseConfig,
      font: '12px sans-serif',
      scaleByDistance: new NearFarScalar(1200, 1.2, 6000, 0.3), // 近处放大 1.2x，远处缩小到 0.3x
      translucencyByDistance: new NearFarScalar(2000, 1.0, 8000, 0.0), // 2000m 内全不透，8000m 完全透明
      distanceDisplayCondition: new DistanceDisplayCondition(0, 10000)
    };
  }

  // MinePoint类型的配置（无额外配置）
  return baseConfig;
}
