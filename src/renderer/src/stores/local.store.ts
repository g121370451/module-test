import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LocalPluginGroup } from '../types'
import type { MountUIRequest } from '../../../preload/types/plugin'
import { MarketItem } from 'src/preload/types/market'

// 定义当前活跃 UI 的状态接口
export interface ActiveUIState {
  id: string
  version: string
  mode: 'view' | 'window'
}

export const useLocalStore = defineStore('local', () => {
  // --- State ---
  const localPlugins = ref<LocalPluginGroup[]>([])
  const currentActiveUI = ref<ActiveUIState | null>(null)
  const loading = ref(false)

  // --- Actions ---

  /**
   * 获取本地安装的插件列表
   */
  const fetchLocalPlugins = async (): Promise<void> => {
    loading.value = true
    try {
      // 假设你有 LocalApi.getList()，这里直接用 window.electronAPI 模拟
      // 实际建议封装到 src/api/local.ts
      const res = await window.api.market.list()
      if (res.code === 0) {
        localPlugins.value = res.data.map((item: MarketItem) => ({
          id: item.id,
          name: item.name,
          versions: [
            {
              version: item.version,
              path: '',
              status: 'running'
            }
          ]
        }))
      }
    } catch (e) {
      console.error('[Store] Failed to fetch local plugins', e)
    } finally {
      loading.value = false
    }
  }

  //   /**
  //    * 启动/停止后台进程
  //    */
  //   const controlProcess = async (
  //     groupId: string,
  //     version: string,
  //     action: 'start' | 'stop'
  //   ): Promise<void> => {
  //     try {
  //       // 调用后端接口控制进程
  //       const res = await window.electronAPI.invoke('plugin:control', {
  //         pluginId: groupId,
  //         version,
  //         action
  //       })

  //       if (res.success) {
  //         // 成功后刷新列表，更新状态 (Running/Stopped)
  //         await fetchLocalPlugins()

  //         // 如果是停止进程，且当前 UI 正好是该插件，则关闭 UI
  //         if (action === 'stop' && isUiActive(groupId, version)) {
  //           currentActiveUI.value = null
  //         }
  //       }
  //     } catch (e) {
  //       console.error(`[Store] Failed to ${action} process`, e)
  //     }
  //   }

  /**
   * 挂载 UI (逻辑部分)
   * 注意：View 模式需要的 bounds 参数由组件层传入
   */
  const mountUI = async (payload: MountUIRequest): Promise<void> => {
    try {
      const res = await window.api.plugin_ui.mount(payload)
      if (res.code === 0 && res.data) {
        // 记录当前活跃状态
        currentActiveUI.value = {
          id: payload.pluginId,
          version: payload.version,
          mode: payload.mode
        }
      }
    } catch (e) {
      console.error('[Store] Failed to mount UI', e)
      // 可以抛出错误供 UI 层弹窗提示
      throw e
    }
  }

  /**
   * 卸载 UI
   */
  const unmountUI = async (): Promise<void> => {
    if (!currentActiveUI.value) return

    try {
      const res = await window.api.plugin_ui.unmount({
        pluginId: currentActiveUI.value.id
      })
      if (res.code === 0) {
        currentActiveUI.value = null
      }
    } catch (e) {
      console.error('[Store] Failed to unmount UI', e)
    }
  }

  //   /**
  //    * 卸载插件 (物理删除)
  //    */
  //   const uninstallPlugin = async (groupId: string, version: string): Promise<void> => {
  //     try {
  //       const res = await window.electronAPI.invoke('market:uninstall', { id: groupId, version })
  //       if (res.success) {
  //         await fetchLocalPlugins()
  //       }
  //     } catch (e) {
  //       console.error('[Store] Uninstall failed', e)
  //     }
  //   }

  // --- Getters / Helpers ---
  const isUiActive = (id: string, version: string): boolean => {
    return currentActiveUI.value?.id === id && currentActiveUI.value?.version === version
  }

  return {
    localPlugins,
    currentActiveUI,
    loading,
    fetchLocalPlugins,
    // controlProcess,
    mountUI,
    unmountUI,
    // uninstallPlugin,
    isUiActive
  }
})
