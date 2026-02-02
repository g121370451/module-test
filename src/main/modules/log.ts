import { app } from 'electron'
import path from 'path'
import log from 'electron-log/main'

log.initialize({ preload: true })
const userDataPath = app.getPath('userData')

log.transports.file.resolvePathFn = (_, message) => {
  const processType = message?.variables?.processType
  if (processType === 'renderer') {
    return path.join(userDataPath, 'logs/renderer.log')
  }
  return path.join(userDataPath, 'logs/main.log')
}

export { log }
