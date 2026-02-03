/// <reference types="vite/client" />
import { ElectronAPI } from '@electron-toolkit/preload'
import { api } from '../../preload/index'

declare global {
  interface Window {
    // 这里的 electron 是 toolkit 提供的
    electron: ElectronAPI
    // 这里的 api 动态引用了 preload 里的实现类型
    api: typeof api
  }
}
