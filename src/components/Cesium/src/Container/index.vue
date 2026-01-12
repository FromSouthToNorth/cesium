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

watch(() => unref(getActiveEntity), (newVal) => {
  popupShow.value = false;
  afterClose(false)
  console.log('getActiveEntity: ', newVal);
  const { type, model } = toRaw(newVal);
  if (type === 'cartographic') {
    position.value = newVal.position;
    popup.value.title = '经纬度信息';
    popup.value.content = `经度: ${newVal.longitude}, 纬度: ${newVal.latitude}`;
    popupShow.value = true;
  }
  else if (type === 'model') {
    popup.value.model = model
    popup.value.type = 'modelSlider'
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
