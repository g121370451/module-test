// src/types/plugin.ts

export type UIMode = 'view' | 'window'

export interface PluginUIRect {
  x: number
  y: number
  width: number
  height: number
}

export interface MountUIRequest {
  pluginId: string
  version: string
  mode: UIMode
  /**
   * 仅在 mode='view' 时需要。
   * 前端需要计算占位 DOM 的绝对位置传过来。
   */
  bounds?: PluginUIRect
}

export interface UnmountUIRequest {
  pluginId: string
}
