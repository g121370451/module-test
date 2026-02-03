import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { market } from './modules/market'
import { plugin_ui } from './modules/plugin-ui'
// Custom APIs for renderer
export const api = {
  market,
  plugin_ui
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
