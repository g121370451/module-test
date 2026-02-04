<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <h1>插件市场</h1>
        <button class="btn btn-text" :disabled="loading" @click="handleRefresh">
          {{ loading ? '刷新中...' : '刷新列表' }}
        </button>
      </div>
    </header>

    <div v-if="loading && marketList.length === 0" class="loading-area">加载数据中...</div>

    <div v-else class="grid-layout">
      <div v-for="item in marketList" :key="item.id" class="plugin-card">
        <div class="card-top">
          <h3>{{ item.name }}</h3>
          <span class="badge">{{ item.version }}</span>
        </div>

        <div class="card-actions">
          <button
            v-if="!item.downloadState"
            class="btn btn-primary btn-sm"
            @click="store.downloadPlugin(item)"
          >
            获取
          </button>

          <div v-else-if="isLoadingState(item.downloadState)" class="progress-box">
            <span>{{ item.downloadState.progress }}%</span>
          </div>

          <button v-else disabled class="btn btn-outline">已安装</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia' // ⚠️ 关键：保持解构后的响应性
import { useMarketStore } from '../stores/market.store'
import { DownloadTask } from '../../../preload/types/market'
export default defineComponent({
  name: 'MarketView',
  setup() {
    // 1. 初始化 Store
    const store = useMarketStore()

    // 2. 解构 State (必须用 storeToRefs，否则失去响应性)
    const { marketList, loading } = storeToRefs(store)

    // 3. 监听器清理函数引用
    let cleanupListener: (() => void) | null = null

    // 4. 生命周期管理
    onMounted(() => {
      // A. 加载数据 (如果 Store 里已经有数据，它会自动跳过，除非传 true)
      store.fetchMarketList()

      // B. 注册实时进度监听
      // 当 Electron 发来 update 事件时，直接调用 store 的 action 更新数据
      cleanupListener = window.api.market.onMarketUpdate((tasks: DownloadTask[]) => {
        store.handleRealtimeUpdate(tasks)
      })
    })

    onUnmounted(() => {
      // 移除 IPC 监听，防止内存泄漏
      if (cleanupListener) {
        cleanupListener()
      }
    })

    // 5. 界面交互
    const handleRefresh = (): void => {
      store.fetchMarketList(true) // 强制刷新
    }

    // UI 辅助函数
    const isLoadingState = (task: DownloadTask): boolean => {
      return ['pending', 'downloading', 'extracting'].includes(task.status)
    }

    return {
      // State
      marketList,
      loading,
      // Store 实例 (用于在 template 直接调 action)
      store,
      // Methods
      handleRefresh,
      isLoadingState
    }
  }
})
</script>
