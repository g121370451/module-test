import { ipcRenderer } from 'electron'
import MarketController from '../../main/controllers/Market.controller'
import type { DownloadTask, MarketItem } from '../types/market'
export const market = {
  download: (params: MarketItem): ReturnType<MarketController['download']> =>
    ipcRenderer.invoke('/market/download', params),
  getTasks: (): ReturnType<MarketController['getTasks']> => ipcRenderer.invoke('/market/get-tasks'),
  list: (): ReturnType<MarketController['list']> => ipcRenderer.invoke('/market/list'),
  onMarketUpdate: (callback: (tasks: DownloadTask[]) => void) => {
    const listener = (_event, tasks: DownloadTask[]): void => {
      callback(tasks)
    }
    ipcRenderer.on('market:update', listener)
    return () => ipcRenderer.removeListener('market:update', listener)
  }
}
