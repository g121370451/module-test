import { ipcRenderer } from 'electron'
import PluginController from '../../main/controllers/PluginUi.controller'
import { MountUIRequest, UnmountUIRequest } from '../types/plugin'
export const plugin_ui = {
  mount: (params: MountUIRequest): ReturnType<PluginController['mount']> =>
    ipcRenderer.invoke('/plugin-ui/mount', params),
  unmount: (params: UnmountUIRequest): ReturnType<PluginController['unmount']> =>
    ipcRenderer.invoke('/plugin-ui/unmount', params)
}
