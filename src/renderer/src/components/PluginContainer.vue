<template>
  <div ref="containerRef" class="plugin-placeholder">
    <div v-if="loading" class="loading-mask">插件加载中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  pluginPath: String, // 插件物理路径
  active: Boolean // 是否激活
})

const containerRef = ref(null)
const loading = ref(false)
let pluginId = null
let resizeObserver = null

// 计算 DOM 元素的绝对位置 (相对于窗口左上角)
const getBounds = () => {
  const el = containerRef.value
  if (!el) return { x: 0, y: 0, width: 0, height: 0 }

  const rect = el.getBoundingClientRect()
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  }
}

// 挂载插件逻辑
const mount = async () => {
  if (!props.pluginPath) return
  loading.value = true

  try {
    const bounds = getBounds()
    // 调用主进程
    pluginId = await window.api.mountPlugin(props.pluginPath, bounds)
    loading.value = false
  } catch (e) {
    console.error('插件加载失败', e)
  }
}

// 卸载/隐藏逻辑
const unmount = async () => {
  if (pluginId) {
    await window.api.unmountPlugin(pluginId)
  }
}

// 监听 DOM 大小变化 (ResizeObserver 是最规范的做法)
onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    if (props.active && pluginId) {
      const bounds = getBounds()
      window.api.updatePluginBounds(pluginId, bounds)
    }
  })
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  unmount()
  if (resizeObserver) resizeObserver.disconnect()
})

// 监听 props 变化
watch(
  () => props.active,
  (val) => {
    if (val) mount()
    else unmount()
  }
)
</script>

<style scoped>
.plugin-placeholder {
  /* 关键：必须设置宽高，否则 div 默认高度为 0 */
  width: 100%;
  height: 100%;
  flex: 1; /* 如果父级是 flex 布局 */
  min-height: 200px; /* 兜底：最少给个高度，防止 0x0 */
  background: #2b2b2b; /* 调试用：给个背景色，看看它到底显示出来没 */
  position: relative;
}
.loading-mask {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #888;
}
</style>
