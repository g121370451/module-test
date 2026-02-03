import { ref, onMounted, onUnmounted } from 'vue'

export function Market() {
  // 1. 响应式状态
  const marketList = ref<MarketItem[]>([])
  const loading = ref(false)

  // 2. 内部 helper: 将下载任务状态合并到 marketList 中
  const mergeProgress = (tasks: DownloadTask[]) => {
    // 遍历所有任务，更新对应的插件状态
    tasks.forEach(task => {
      // 注意：这里假设 id + version 是唯一键
      const target = marketList.value.find(
        item => item.id === task.id && item.version === task.version
      )
      if (target) {
        target.downloadState = task
      }
    })
  }

  // 3. 核心业务: 初始化/刷新列表
  const fetchMarketList = async () => {
    loading.value = true
    try {
      // A. 获取静态列表
      const listRes = await window.api.market.list()
      if (listRes.code == 0) {
        // 初始化列表，downloadState 默认为空
        marketList.value = listRes.data.map(item => ({
          ...item,
          downloadState: undefined
        }))

        // B. 获取当前正在下载的任务，回填进度
        const tasksRes = await window.api.market.getTasks()
        if (tasksRes.code == 0) {
          mergeProgress(tasksRes.data)
        }
      } else {
        console.error('Failed to load market list:', listRes.message)
      }
    } catch (error) {
      console.error('Network or IPC error:', error)
    } finally {
      loading.value = false
    }
  }

  // 4. 核心业务: 下载
  const handleDownload = async (item: MarketItem) => {
    // 乐观更新：点击瞬间先设为 pending，避免按钮闪烁
    if (item.downloadState) return // 防止重复点击
    const itemCopy = JSON.parse(JSON.stringify(item)) as MarketItem
    // 调用 API
    const res = await window.api.market.download(itemCopy)
    if (res.code !== 0) {
      console.error('Download failed to start:', res.message)
      // TODO: 可以触发一个全局 Toast 报错
    }
    // 注意：不需要手动设置 progress，因为后端会立即通过 onMarketUpdate 发送事件
  }

  // 6. 生命周期管理
  let removeIpcListener: (() => void) | null = null

  onMounted(async () => {
    fetchMarketList()

    // 建立监听，并保存返回的清理函数
    // 这里的 window.electronAPI.onMarketUpdate 必须返回一个调用 ipcRenderer.removeListener 的函数
    removeIpcListener = window.api.market.onMarketUpdate((tasks: DownloadTask[]) => {
      // 更新逻辑...
      console.log('收到更新', tasks)
    })
  })

  // 这里的“卸载”是针对 IPC 通道的卸载
  onUnmounted(() => {
    if (removeIpcListener) {
      removeIpcListener()
      console.log('[Hook] IPC Listener unmounted')
    }
  })

  // 7. 暴露给 Vue 模板的数据和方法
  return {
    marketList,
    loading,
    fetchMarketList,
    handleDownload
  }
}