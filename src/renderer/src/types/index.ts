export interface LocalVersion {
  version: string
  path: string
  status: 'running' | 'stopped' | 'error'
}

export interface LocalPluginGroup {
  name: string
  id: string // 方便遍历
  versions: LocalVersion[]
}

export interface DeviceItem {
  id: string
  desc: string
  status: 'online' | 'busy' | 'offline'
  pluginId?: string
}
