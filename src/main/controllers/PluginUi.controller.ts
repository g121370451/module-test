import Result from '../entity/result'
import { IpcController, IpcHandle } from '../modules/IpcDecorators'
import { log } from '../modules/log'
import main from 'electron/main'
import { PluginService } from '../services/PluginUi.service'
import type { MountUIRequest, UnmountUIRequest } from '../../preload/types/plugin'
@IpcController('/plugin-ui')
export default class PluginUiController {
  private service: PluginService

  constructor() {
    this.service = PluginService.getInstance()
  }

  /**
   * 挂载 UI (View 或 Window)
   */
  @IpcHandle('/mount')
  public async mount(
    _event: main.IpcMainInvokeEvent,
    params: MountUIRequest
  ): Promise<Result<boolean>> {
    try {
      const { mode, bounds } = params

      // 简单的参数校验
      if (mode === 'view' && !bounds) {
        log.error('plugin-ui/mount failed: bounds required for view mode')
        return Result.success(false)
      }

      await this.service.mountUI(params)
      return Result.success(true)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      log.error(`plugin-ui/mount failed for ${params.pluginId}`, msg)
      return Result.success(false)
    }
  }

  /**
   * 卸载 UI
   */
  @IpcHandle('/unmount')
  public async unmount(
    _event: main.IpcMainInvokeEvent,
    params: UnmountUIRequest
  ): Promise<Result<boolean>> {
    try {
      await this.service.unmountUI(params.pluginId)
      return Result.success(true)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      log.error(`plugin-ui/unmount failed`, msg)
      return Result.success(false)
    }
  }
}
