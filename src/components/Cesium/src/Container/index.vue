<script setup>
import { ref, toRaw, unref, onMounted, onUnmounted, watch } from 'vue';

import { initializeCesium, destroyCesium, getActiveEntity } from '@/utils/cesium';

import CesiumPopup from '../Popup/index.vue';

const cesiumContainer = ref(null);
const position = ref({});
const title = ref('信息');
const content = ref('');
const viewer = ref(null);
const popupShow = ref(false);

watch(() => unref(getActiveEntity), (newVal) => {
  popupShow.value = false;
  const { type } = toRaw(newVal);
  if (type === 'cartographic') {
    position.value = newVal.position;
    title.value = '经纬度信息';
    content.value = `经度: ${newVal.longitude}, 纬度: ${newVal.latitude}`;
    popupShow.value = true;
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
    <CesiumPopup v-if="popupShow" :viewer="viewer" :position="position" :title="title" :content="content"
      :offset="[0, 30]" @close="() => { }" />
  </div>
</template>
