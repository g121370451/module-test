import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    l136: {
      send: (channel: string, data?: any) => void;
      onMessage: (callback: (data: any) => void) => void;
    }
  }
}
