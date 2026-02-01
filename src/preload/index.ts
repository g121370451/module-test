import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  mountPlugin: (pluginPath, rect) => ipcRenderer.invoke('plugin:mount', { pluginPath, rect }),
  unmountPlugin: (pluginId) => ipcRenderer.invoke('plugin:unmount', pluginId),
  updatePluginBounds: (pluginId, rect) =>
    ipcRenderer.send('plugin:update-bounds', { pluginId, rect })
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
