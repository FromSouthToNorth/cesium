<!-- CesiumPopup.vue -->
<template>
  <div v-if="visible" ref="popupRef" class="cesium-custom-popup" :style="popupStyle">
    <div class="popup-header">
      <h3 class="popup-title">{{ title }}</h3>
      <span class="popup-close" @click="handleClose">×</span>
    </div>
    <div class="popup-content">
      <!-- 支持传入 HTML 或插槽 -->
      <slot name="default">
        <span v-html="content" />
      </slot>
    </div>
    <div class="popup-tip-container">
      <div class="popup-tip"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { SceneTransforms } from 'cesium'

defineOptions({
  name: 'CesiumPopup'
})

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  },
  position: {
    type: [Object, Array], // Cesium.Cartesian3
    required: true
  },
  title: {
    type: String,
    default: '信息'
  },
  content: {
    type: String,
    default: ''
  },
  offset: {
    type: Array,
    default: () => [0, 30] // [x, y] 像素偏移
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)
const popupRef = ref(null)
const removePostRender = ref(null)

// 计算弹窗位置样式
const popupStyle = computed(() => {
  if (!visible.value || !screenPosition.value) {
    return { display: 'none' }
  }

  const [offsetX, offsetY] = props.offset

  return {
    left: `${screenPosition.value.x}px`,
    top: `${screenPosition.value.y}px`,
    transform: `translate(calc(-50% + ${offsetX}px), calc(-100% + ${offsetY}px))`,
    display: 'block'
  }
})

// 屏幕坐标
const screenPosition = ref(null)

const updatePosition = () => {
  if (!props.position || !props.viewer?.scene) {
    visible.value = false
    return
  }

  try {
    const pos = SceneTransforms.worldToWindowCoordinates(
      props.viewer.scene,
      props.position
    )

    if (!pos) {
      visible.value = false
      return
    }
    screenPosition.value = pos
    visible.value = true
  } catch (e) {
    console.warn('CesiumPopup: 坐标转换失败', e)
    visible.value = false
  }
}

const handleClose = () => {
  visible.value = false
  emit('close')
}

// 监听 Esc 关闭
const handleEsc = (e) => {
  if (e.key === 'Escape' && visible.value) {
    handleClose()
  }
}

// 注册/注销 postRender
const bindPostUpdate = () => {
  if (!props.viewer?.scene?.postUpdate) return

  removePostRender.value = props.viewer.scene.postUpdate.addEventListener(() => {
    updatePosition()
  })
}

const unbindPostRender = () => {
  if (removePostRender.value) {
    removePostRender.value()
    removePostRender.value = null
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEsc)

  bindPostUpdate()
  // 初次显示
  updatePosition()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
  unbindPostRender()
})

// 监听 position 变化
watch(
  () => props.position,
  () => {
    updatePosition()
  },
  { deep: true }
)

// 暴露方法给外部调用
defineExpose({
  show: () => {
    visible.value = true
    updatePosition()
  },
  hide: () => {
    visible.value = false
  },
  updatePosition
})
</script>

<style scoped>
.cesium-custom-popup {
  position: absolute;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 12px 16px;
  border-radius: 6px;
  min-width: 220px;
  max-width: 360px;
  font-size: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  pointer-events: auto;
  z-index: 1000;
  user-select: text;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px solid #555;
  padding-bottom: 6px;
}

.popup-title {
  margin: 0;
  font-size: 16px;
}

.popup-close {
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
}

.popup-close:hover {
  color: #ff6b6b;
}

.popup-content {
  line-height: 1.5;
}

.popup-tip-container {
  margin: 0 auto;
  width: 40px;
  height: 17px;
  position: relative;
  overflow: hidden;
  bottom: -29px;
}

.popup-tip {
  background: rgba(0, 0, 0, 0.85);
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.4);
  width: 17px;
  height: 17px;
  padding: 1px;
  margin: -10px auto 0;
  -webkit-transform: rotate(45deg);
  -moz-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  -o-transform: rotate(45deg);
  transform: rotate(45deg);
}
</style>
