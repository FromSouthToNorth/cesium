<script setup>
import { ref, toRaw, unref, onMounted, onUnmounted, watch } from 'vue';

import { initializeCesium, destroyCesium, getActiveEntity } from '@/utils/cesium';

import CesiumPopup from '../Popup/index.vue';
import Modal from '@/components/Modal'

const cesiumContainer = ref(null);
const position = ref({});
const title = ref('信息');
const popup = ref({

});
const viewer = ref(null);
const popupShow = ref(false);
const showModal = ref(false);
const modal = ref({})

function afterClose(e) {
  showModal.value = e;
}

function popupClose() {
  popupShow.value = false
}

function createPickedFeatureDescription(pickedFeature) {
  const { columns } = pickedFeature;
  if (!columns) {
    return;
  }
  const _columns = columns.getValue ? columns.getValue() : columns;
  const col = _columns.map(({ title, dataIndex }) => {
    return `<tr><th>${title}</th><td>${pickedFeature[dataIndex]}</td></tr> `;
  });
  const description = `<table class="cesium-infoBox-defaultTable"> ${col.join('')}</table> `;
  return description;
}

watch(() => unref(getActiveEntity), (newVal) => {
  popupShow.value = false;
  afterClose(false)
  console.log('getActiveEntity: ', newVal);
  const { type, obj } = toRaw(newVal);
  position.value = newVal.position;
  if (type === 'cartographic') {
    popup.value.title = '经纬度信息';
    popup.value.content = `经度: ${newVal.longitude}, 纬度: ${newVal.latitude}`;
    popupShow.value = true;
  }
  else if (type === 'object') {
    const properties = obj.properties;
    if (!properties) return
    popup.value.title = properties.name;
    popup.value.content = createPickedFeatureDescription(properties);
    popupShow.value = true;
  }
  else if (type === 'model') {
    popup.value.model = obj;
    popup.value.type = 'modelSlider';
    showModal.value = true;
  }
});

onMounted(() => {
  viewer.value = initializeCesium(cesiumContainer.value);
});

onUnmounted(() => {
  destroyCesium();
});
</script>

<template>
  <div id="cesium-container" ref="cesiumContainer">
    <CesiumPopup v-if="popupShow" :viewer="viewer" :position="position" :title="popup.title" :content="popup.content"
      :offset="[0, -10]" @close="popupClose" />
    <Modal :showModal="showModal" @afterClose="afterClose" :mask="false" :content="popup" />
  </div>
</template>
