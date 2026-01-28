import { ipcRenderer } from 'electron'
export const PLUGIN_ID = 'plugin-l136'
export const plugin = {
  show: async (): Promise<void> =>
    ipcRenderer.invoke(`${PLUGIN_ID}:show`),
  hidden: async (): Promise<void> =>
    ipcRenderer.invoke(`${PLUGIN_ID}:hidden`),
}
