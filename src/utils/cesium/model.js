import { unref, toRaw } from 'vue'

import {
  Transforms,
  Cartesian3,
  Matrix4,
  Matrix3,
  SceneTransforms,
  Math as CesiumMath,
  Cesium3DTileset,
  Model,
  Quaternion,
  HeadingPitchRoll,
  Ellipsoid,
  Axis,
} from 'cesium';


import { useCesium } from '@/hooks/cesium/useCesium';
const viewer = () => {
  const { viewerRef } = useCesium();
  return toRaw(unref(viewerRef));
}

const modelMap = new Map()

function setModelMap(key, model) {
  modelMap.set(key, model)
}

function getModelMap(key) {
  return modelMap.get(key)
}

export function initModel(position, name) {
  try {
    const _posit = Cartesian3.fromDegrees(
      position[0],
      position[1],
      position[2]
    )
    const modelMatrix = Transforms.eastNorthUpToFixedFrame(_posit);
    Model.fromGltfAsync({
      url: '/src/assets/model/JKYHMK.glb',
      modelMatrix,
      upAxis: Axis.Y,
      forwardAxis: Axis.X
    }).then(e => {
      const model = viewer().scene.primitives.add(e);
      model.readyEvent.addEventListener(() => {
        model.position = _posit
        setModelMap(name, model);
      });
    });
  } catch (error) {
    console.log('model error: ', error);
  }
}


/**
 * 平移 3D Tiles 模型 Z 代表地上地下,X 代表东,Y 代表北
 * @param {*} tileset 
 * @param {*} translation 
 */
function tilesetTranslate(tileset, translation, rotation, scale) {
  const { x, y, z } = translation;
  setInitMatrix4Map(tileset);
  const modelMatrix = getInitMatrix4Map(tileset);
  const origin = tileset.boundingSphere.center;
  const toWorldMatrix = Transforms.eastNorthUpToFixedFrame(origin);
  const translatePosition = new Cartesian3(x, y, z);
  const worldPosition = Matrix4.multiplyByPoint(toWorldMatrix, translatePosition, new Cartesian3());
  const offset = Cartesian3.subtract(
    worldPosition,
    origin,
    new Cartesian3()
  );
  const translationMatrix = Matrix4.fromTranslation(offset);


  const { x: rx, y: ry, z: rz } = rotation;
  setInitMatrix4Map(tileset);
  // 获取中心点。
  // 以该点建立ENU坐标系
  // 获取ENU矩阵的逆矩阵。也就是可以将世界坐标重新转为ENU坐标系的矩阵
  const toLocalMatrix = Matrix4.inverse(toWorldMatrix, new Matrix4())
  // 计算旋转矩阵
  const rotateMatrix = Matrix4.clone(Matrix4.IDENTITY)
  if (rx !== 0) {
    const rotateXMatrix = Matrix4.fromRotation(Matrix3.fromRotationX(CesiumMath.toRadians(rx)))
    Matrix4.multiply(rotateXMatrix, rotateMatrix, rotateMatrix)
  }
  if (ry !== 0) {
    const rotateYMatrix = Matrix4.fromRotation(Matrix3.fromRotationY(CesiumMath.toRadians(ry)))
    Matrix4.multiply(rotateYMatrix, rotateMatrix, rotateMatrix)
  }
  if (rz !== 0) {
    const rotateZMatrix = Matrix4.fromRotation(Matrix3.fromRotationZ(CesiumMath.toRadians(rz)))
    Matrix4.multiply(rotateZMatrix, rotateMatrix, rotateMatrix)
  }
  // ENU坐标系下的结果矩阵
  const localResultMatrix = Matrix4.multiply(rotateMatrix, toLocalMatrix, new Matrix4())
  // 世界坐标系下的结果矩阵
  const rotationMatrix = Matrix4.multiply(toWorldMatrix, localResultMatrix, new Matrix4())

  // 计算缩放矩阵
  const scaleMatrix = Matrix4.fromScale(new Cartesian3(scale, scale, scale),)
  // ENU坐标系下的结果矩阵
  const scaleResultMatrix = Matrix4.multiply(scaleMatrix, toLocalMatrix, new Matrix4())
  // 世界坐标系下的结果矩阵
  const worldscaleResultMatrix = Matrix4.multiply(toWorldMatrix, scaleResultMatrix, new Matrix4())

  let finalMatrix = Matrix4.clone(modelMatrix)

  finalMatrix = Matrix4.multiply(finalMatrix, scaleMatrix, finalMatrix)
  finalMatrix = Matrix4.multiply(finalMatrix, rotationMatrix, finalMatrix)
  finalMatrix = Matrix4.multiply(finalMatrix, translationMatrix, finalMatrix)
  tileset.modelMatrix = finalMatrix
}

function setModelHeadingPitchRoll(model, pitch, roll, heading) {
  console.log('model: ', model);
  console.log('heading: ', heading);
  const { position } = model;
  if (!position) return;
  // const frame = Transforms.eastNorthUpToFixedFrame(position);
  const hpr = new HeadingPitchRoll(
    CesiumMath.toRadians(heading),
    CesiumMath.toRadians(pitch),
    CesiumMath.toRadians(roll)
  );

  const modelMatrix = Transforms.headingPitchRollToFixedFrame(
    position,
    hpr,
    Ellipsoid.WGS84
  );
  console.log(modelMatrix);
  model.modelMatrix = modelMatrix;
  // 使用示例（可在任何地方调用）
  const _hpr = getHeadingPitchRollFromModelMatrix(model)
  if (hpr) {
    console.log(`从矩阵解析得到: Heading ${_hpr.heading.toFixed(2)}°`)
  }
}

/**
 * 从 modelMatrix 反解 Heading Pitch Roll（单位：度）
 * @param {Cesium.Model} model 
 * @returns {Object} {heading, pitch, roll} 单位：度
 */
function getHeadingPitchRollFromModelMatrix(model) {
  if (!model || !model.ready || !model.modelMatrix) return null

  const matrix = model.modelMatrix

  // 1. 获取旋转部分（4x4 旋转矩阵）
  const rotationMatrix = Matrix4.fromRotationTranslation(
    new Matrix4(),
    matrix
  )

  // 2. 转成四元数
  const quaternion = Quaternion.fromRotationMatrix(matrix)

  // 3. 四元数 → HeadingPitchRoll（Cesium 内置方法）
  const hpr = new HeadingPitchRoll()
  HeadingPitchRoll.fromQuaternion(quaternion, hpr)

  // 4. 转回角度（度）
  return {
    heading: CesiumMath.toDegrees(hpr.heading),
    pitch: CesiumMath.toDegrees(hpr.pitch),
    roll: CesiumMath.toDegrees(hpr.roll)
  }
}

/**
 * 
 * @param {*} model 
 * @param {*} translation 
 * @param {*} rotation 
 * @param {*} scale 
 */
export function translateModel(model, translation, rotation, scale) {
  if (model instanceof Cesium3DTileset) {
    tilesetTranslate(model, translation, rotation, scale)
  }
  else if (model instanceof Model) {
    const { x, y, z } = rotation
    setModelHeadingPitchRoll(model, x, y, z)
  }
}
