import { ipcRenderer } from 'electron'
import MarketController from '../../main/controllers/Market.controller'

export const market = {
  download: (params: MarketItem): ReturnType<MarketController['download']> =>
    ipcRenderer.invoke('/market/download', params),
  getTasks: (): ReturnType<MarketController['getTasks']> => ipcRenderer.invoke('/market/get-tasks'),
  list: (): ReturnType<MarketController['list']> => ipcRenderer.invoke('/market/list'),
  onMarketUpdate: (callback: (tasks: DownloadTask[]) => void) => {
    ipcRenderer.on('market:update', (_event, tasks: DownloadTask[]) => {
      callback(tasks)
    })
  }
}
