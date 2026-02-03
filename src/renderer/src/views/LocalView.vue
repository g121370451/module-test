<template>
  <div class="view-container">
    <header class="view-header">
      <div class="header-left">
        <h1>本地插件管理</h1>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="store.fetchLocalPlugins">
          {{ loading ? '刷新中...' : '刷新列表' }}
        </button>
      </div>
    </header>

    <div class="plugin-list-area">
      <div v-if="localPlugins.length === 0" class="empty-state">
        暂无安装的插件，请前往市场下载。
      </div>

      <div v-for="group in localPlugins" :key="group.id" class="plugin-group">
        <div class="group-header">
          <span class="icon-folder">📂</span>
          <span class="group-name">{{ group.name }}</span>
          <span class="group-id">{{ group.id }}</span>
        </div>

        <div class="version-list">
          <div v-for="ver in group.versions" :key="ver.version" class="version-item">
            <div class="ver-info">
              <div class="ver-badges">
                <span class="ver-number">v{{ ver.version }}</span>
                <span class="status-badge" :class="ver.status">
                  {{ ver.status.toUpperCase() }}
                </span>
              </div>
              <div class="ver-path">{{ ver.path }}</div>
            </div>

            <div class="ver-actions">
              <template v-if="ver.status === 'stopped'">
                <button class="btn btn-text text-success">
                  <!-- @click="store.controlProcess(group.id, ver.version, 'start')" -->
                  启动进程
                </button>
                <button
                  class="btn btn-text text-sub"
                  @click="handleUninstallClick(group.id, ver.version)"
                >
                  卸载
                </button>
              </template>

              <template v-else>
                <div class="ui-controls">
                  <span class="control-label">界面:</span>
                  <button
                    class="btn btn-xs"
                    :class="
                      store.isUiActive(group.id, ver.version) && currentActiveUI?.mode === 'view'
                        ? 'btn-primary'
                        : 'btn-outline'
                    "
                    @click="handleMountClick(group.id, ver.version, 'view')"
                  >
                    嵌入
                  </button>
                  <button
                    class="btn btn-xs btn-outline"
                    @click="handleMountClick(group.id, ver.version, 'window')"
                  >
                    弹窗
                  </button>
                </div>

                <div class="divider-vertical"></div>

                <button class="btn btn-text text-danger">
                  <!-- @click="store.controlProcess(group.id, ver.version, 'stop')" -->
                  停止进程
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="ui-stage-area">
      <div class="stage-header">
        <h3>插件运行视窗 (Stage)</h3>
        <div v-if="currentActiveUI" class="active-info">
          正在显示: {{ currentActiveUI.id }} ({{ currentActiveUI.mode }})
          <button class="btn btn-text text-danger btn-sm" @click="store.unmountUI">关闭界面</button>
        </div>
      </div>

      <div ref="uiPlaceholderRef" class="ui-placeholder">
        <div v-if="!currentActiveUI" class="placeholder-content">
          <span class="placeholder-icon">🖥️</span>
          <p>点击上方“嵌入”按钮，插件界面将显示在此处</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLocalStore } from '../stores/local.store'

export default defineComponent({
  name: 'LocalView',
  setup() {
    // 1. 初始化 Store
    const store = useLocalStore()
    // 解构响应式数据
    const { localPlugins, currentActiveUI, loading } = storeToRefs(store)

    // 2. DOM 引用
    const uiPlaceholderRef = ref<HTMLElement | null>(null)

    // 3. 处理 UI 挂载 (连接 DOM 和 Store)
    const handleMountClick = async (
      id: string,
      version: string,
      mode: 'view' | 'window'
    ): Promise<void> => {
      try {
        let bounds: { x: number; y: number; width: number; height: number } | undefined = undefined

        // 如果是嵌入模式，需要计算 DOM 位置
        if (mode === 'view') {
          if (!uiPlaceholderRef.value) {
            console.error('Placeholder DOM not found')
            return
          }
          const rect = uiPlaceholderRef.value.getBoundingClientRect()
          bounds = {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }
        }

        // 调用 Store Action
        await store.mountUI({
          pluginId: id,
          version,
          mode,
          bounds
        })
      } catch (e: unknown) {
        if (e instanceof Error) console.error('Failed to mount plugin UI:', e.message)
        else console.error('Failed to mount plugin UI:', e)
      }
    }

    // 4. 处理卸载 (二次确认逻辑在 UI 层)
    const handleUninstallClick = (id: string, version: string): void => {
      if (confirm(`确认卸载 ${id} v${version}? 这将删除本地文件。`)) {
        // store.uninstallPlugin(id, version)
      }
    }

    // 5. 生命周期
    onMounted(() => {
      store.fetchLocalPlugins()
    })

    onUnmounted(() => {
      // 离开页面时，如果当前是嵌入模式，必须卸载 UI
      // 否则 View 会遮挡其他页面
      if (currentActiveUI.value?.mode === 'view') {
        store.unmountUI()
      }
    })

    return {
      // State
      localPlugins,
      currentActiveUI,
      loading,
      uiPlaceholderRef,

      // Actions/Store
      store, // 暴露 store 以便模板中直接调用简单 action (如 fetchLocalPlugins)
      handleMountClick,
      handleUninstallClick
    }
  }
})
</script>

<style scoped>
/* 样式与之前保持一致即可 */
/* 为了节省篇幅，这里复用上一版样式，重点是上面的逻辑拆分 */
.view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 24px 24px;
  box-sizing: border-box;
}
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 24px 0;
  flex-shrink: 0;
}
.view-header h1 {
  margin: 0;
  font-size: 24px;
  color: var(--text-main);
}

.plugin-list-area {
  flex: 0 0 auto;
  max-height: 40%;
  overflow-y: auto;
  margin-bottom: 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}
.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--text-sub);
}

.plugin-group {
  border-bottom: 1px solid var(--border);
}
.group-header {
  background: var(--surface-light);
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.group-id {
  font-family: monospace;
  color: var(--text-sub);
  font-weight: normal;
  font-size: 12px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.ver-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ver-badges {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ver-number {
  font-weight: bold;
  color: var(--text-main);
}
.ver-path {
  font-size: 12px;
  color: var(--text-sub);
  font-family: monospace;
}
.status-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
.status-badge.running {
  background: rgba(66, 185, 131, 0.15);
  color: var(--success);
}
.status-badge.stopped {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-sub);
}

.ver-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ui-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
}
.control-label {
  font-size: 11px;
  color: var(--text-sub);
}
.divider-vertical {
  width: 1px;
  height: 16px;
  background: var(--border);
}

.ui-stage-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.stage-header {
  padding: 10px 16px;
  background: var(--surface-light);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stage-header h3 {
  margin: 0;
  font-size: 14px;
  color: var(--text-sub);
  font-weight: normal;
}
.active-info {
  font-size: 12px;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.ui-placeholder {
  flex: 1;
  position: relative;
  background: #000;
}
.placeholder-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-sub);
  opacity: 0.5;
}
.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.btn {
  cursor: pointer;
  border: none;
  border-radius: 4px;
  transition: all 0.2s;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 6px 12px;
}
.btn-outline:hover {
  border-color: var(--text-sub);
}
.btn-text {
  background: transparent;
  padding: 4px 8px;
}
.btn-text:hover {
  background: rgba(255, 255, 255, 0.05);
}
.btn-xs {
  font-size: 11px;
  padding: 2px 8px;
  height: 24px;
}
.btn-primary {
  background: var(--primary);
  color: #000;
}
.text-success {
  color: var(--success);
}
.text-danger {
  color: var(--danger);
}
.text-sub {
  color: var(--text-sub);
}
</style>
