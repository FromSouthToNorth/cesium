import { unref, toRaw } from 'vue'

import { Axis, Cartesian3, Model, Transforms } from 'cesium'

import { useCesiumStore } from '@/store/modules/cesiumStore'
const cesiumStore = useCesiumStore()


const modelMap = new Map()

function setModelMap(key, model) {
  modelMap.set(key, model)
}

function getModelMap(key) {
  return modelMap.get(key)
}

export function initModel(position, name) {
  try {
    const viewer = toRaw(unref(cesiumStore.getViewer()));
    const _posit = Cartesian3.fromDegrees(
      position[0],
      position[1],
      position[2]
    )
    const modelMatrix = Transforms.eastNorthUpToFixedFrame(_posit);
    Model.fromGltfAsync({
      url: '/src/assets/model/SXNGMY.glb',
      modelMatrix,
      upAxis: Axis.Y,
      forwardAxis: Axis.X
    }).then(e => {
      const model = viewer.scene.primitives.add(e);
      model.readyEvent.addEventListener(() => {
        setModelMap(name, model);
      });
    });
  } catch (error) {
    console.log('model error: ', error);
  }
}
