<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

import { initializeCesium, destroyCesium } from '@/utils/cesium';

const cesiumContainer = ref(null);

onMounted(() => {
  const value = initializeCesium(cesiumContainer.value);
});

onUnmounted(() => {
  destroyCesium();
});
</script>

<template>
  <div id="cesium-container" ref="cesiumContainer"></div>
</template>
