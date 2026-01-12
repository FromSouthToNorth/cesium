<template>
  <div>
    <Modal ref="modalRef" :destroyOnClose="true" :footer="null" style="top: 50px; width: 260px;" :mask='mask'
      v-model:open="open" :wrap-style="{ overflow: 'hidden' }" @cancel="afterClose" @afterClose="afterClose"
      @ok="handleOk">
      <Menu :menuData="content.data" :sourceTarget="content.sourceTarget" v-if="content.type === 'menu'" />
      <Descriptions :columns="content.columns" :data="content.data" v-else-if="content.type === 'descriptions'" />
      <ModelSlider ref="modelSliderRef" v-else-if="content.type === 'modelSlider'" :model="content.model"
        @originPointClose="afterClose" />
      <template #title>
        <div ref="modalTitleRef" style="width: 100%; cursor: move">{{ content.title }}</div>
      </template>
      <template #modalRender="{ originVNode }">
        <div :style="transformStyle">
          <component :is="originVNode" />
        </div>
      </template>
    </Modal>
  </div>
</template>
<script setup>
import { ref, computed, watch, watchEffect } from 'vue';
import { Button, Modal } from 'ant-design-vue';
import { useDraggable } from '@vueuse/core';
import Descriptions from './Descriptions.vue';
import Menu from './Menu.vue';
import ModelSlider from './ModelSlider.vue';

const props = defineProps({
  content: Object,
  showModal: {
    type: Boolean,
    default: false,
  },
  mask: {
    type: Boolean,
    default: true,
  }
})

const emit = defineEmits(['afterClose'])

const modelSliderRef = ref(null);
const open = ref(false);
const modalTitleRef = ref(null);
watch(() => props.showModal, (val) => {
  open.value = val;
});

function afterClose() {
  emit('afterClose', false);
}

const { x, y, isDragging } = useDraggable(modalTitleRef);
const handleOk = e => {
  open.value = false;
};
const startX = ref(0);
const startY = ref(0);
const startedDrag = ref(false);
const transformX = ref(700);
const transformY = ref(10);
const preTransformX = ref(0);
const preTransformY = ref(0);
const dragRect = ref({
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
});
watch([x, y], () => {
  if (!startedDrag.value) {
    startX.value = x.value;
    startY.value = y.value;
    const bodyRect = document.body.getBoundingClientRect();
    const titleRect = modalTitleRef.value.getBoundingClientRect();
    dragRect.value.right = bodyRect.width - titleRect.width;
    dragRect.value.bottom = bodyRect.height - titleRect.height;
    preTransformX.value = transformX.value;
    preTransformY.value = transformY.value;
  }
  startedDrag.value = true;
});
watch(isDragging, () => {
  if (!isDragging) {
    startedDrag.value = false;
  }
});
watchEffect(() => {
  if (startedDrag.value) {
    transformX.value =
      preTransformX.value +
      Math.min(Math.max(dragRect.value.left, x.value), dragRect.value.right) -
      startX.value;
    transformY.value =
      preTransformY.value +
      Math.min(Math.max(dragRect.value.top, y.value), dragRect.value.bottom) -
      startY.value;
  }
});
const transformStyle = computed(() => {
  return {
    transform: `translate(${transformX.value}px, ${transformY.value}px)`,
  };
});
</script>
