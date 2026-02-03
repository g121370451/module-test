import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MarketItem, DownloadTask } from '../../../preload/types/market'
export const useMarketStore = defineStore('market', () => {
  // --- State (状态) ---
  const marketList = ref<MarketItem[]>([])
  const loading = ref<boolean>(false)
  const isInitialized = ref<boolean>(false) // 标记是否已经加载过数据

  // --- Private Helpers (内部辅助函数) ---

  /**
   * 将下载进度任务合并到当前的列表中
   */
  const mergeTaskProgress = (tasks: DownloadTask[]): void => {
    if (marketList.value.length === 0) return

    tasks.forEach((task) => {
      const target = marketList.value.find(
        (item) => item.id === task.id && item.version === task.version
      )
      if (target) {
        target.downloadState = task
      }
    })
  }

  // --- Actions (动作/业务逻辑) ---

  /**
   * 获取市场列表数据 (支持缓存策略)
   * @param forceRefresh 是否强制刷新
   */
  const fetchMarketList = async (forceRefresh = false): Promise<void> => {
    // 如果已经初始化过且不是强制刷新，则直接返回，保留现有状态
    if (isInitialized.value && !forceRefresh) return

    loading.value = true
    try {
      // 1. 获取静态列表
      const listRes = await window.api.market.list()
      if (listRes.code === 0) {
        // 重置列表，并保留之前的状态结构
        marketList.value = listRes.data.map((item) => ({
          ...item,
          downloadState: undefined
        }))

        // 2. 获取当前正在进行的任务 (同步进度)
        const tasksRes = await window.api.market.getTasks()
        if (tasksRes.code === 0) {
          mergeTaskProgress(tasksRes.data)
        }

        isInitialized.value = true
      } else {
        console.error('[Store] Failed to fetch market list:', listRes.message)
      }
    } catch (error) {
      console.error('[Store] Network error:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 触发下载
   */
  const downloadPlugin = async (item: MarketItem): Promise<void> => {
    if (item.downloadState) return // 防止重复点击

    // 乐观更新 UI (可选): 立即显示 pending 状态
    // item.downloadState = { id: item.id, version: item.version, status: 'pending', progress: 0 }

    const res = await window.api.market.download(item)
    if (res.code !== 0) {
      console.error('[Store] Download failed:', res.message)
      // 如果失败，清除状态
      item.downloadState = undefined
    }
  }

  /**
   * 卸载插件 (仅逻辑调用)
   */
  const uninstallPlugin = async (item: MarketItem): Promise<void> => {
    // 这里假设你在 Api 层有 uninstall 方法
    // const res = await MarketApi.uninstall({ id: item.id, version: item.version })
    // if (res.success) {
    //   item.downloadState = undefined
    // }
    console.log('Uninstall requested for', item.id)
  }

  /**
   * 接收后端推送的实时进度更新
   */
  const handleRealtimeUpdate = (tasks: DownloadTask[]): void => {
    mergeTaskProgress(tasks)
  }

  return {
    // State
    marketList,
    loading,

    // Actions
    fetchMarketList,
    downloadPlugin,
    uninstallPlugin,
    handleRealtimeUpdate
  }
})
