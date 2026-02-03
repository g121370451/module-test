import Result from '../entity/result'
import { IpcController, IpcHandle } from '../modules/IpcDecorators'
import { log } from '../modules/log'
import main from 'electron/main'
import { MarketService } from '../services/Marker.service'
import type { DownloadTask, MarketItem } from '../../preload/types/market'
@IpcController('/market')
export default class MarketController {
  private installer: MarketService
  constructor() {
    log.debug('market construct')
    this.installer = MarketService.getInstance()
  }
  @IpcHandle('/download')
  public async download(
    _event: main.IpcMainInvokeEvent,
    params: MarketItem
  ): Promise<Result<null> | Result<boolean>> {
    try {
      const { id, version, url, name, deps } = params as MarketItem
      if (!this.installer) {
        log.error('market/download', 'Market service not initialized')
        return Result.success(false)
      }
      this.installer.install(id, version, url, deps)
      log.info(`market/download: Started installation for ${name} (${id}) version ${version}`)
      return Result.success(true)
    } catch (e: unknown) {
      if (e instanceof Error) {
        log.error('market/get-setting', e.message)
        return Result.error(e.message)
      }
      log.error('market/get-setting', e)
      return Result.error()
    }
  }

  @IpcHandle('/get-tasks')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getTasks(_event: main.IpcMainInvokeEvent): Promise<Result<DownloadTask[]>> {
    try {
      const tasks = this.installer.getTasks()
      log.info(`market/get-tasks: Got ${tasks.length} tasks`)
      return Result.success(tasks)
    } catch (e: unknown) {
      if (e instanceof Error) {
        log.error('market/get-tasks', e.message)
        return Result.success([])
      }
      log.error('market/get-tasks', e)
      return Result.success([])
    }
  }
  /**
   * 新增：获取插件市场列表
   * 通常从 OSS 或 API 获取 manifest.json
   */
  @IpcHandle('/list')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async list(_event: main.IpcMainInvokeEvent): Promise<Result<MarketItem[]>> {
    try {
      // 调用 Service 层去获取数据
      const list = await this.installer.getMarketList()

      log.info(`market/list: Successfully fetched ${list.length} plugins from market`)
      return Result.success(list)
    } catch (e: unknown) {
      // 错误处理符合 ESLint 规范
      if (e instanceof Error) {
        log.error('market/list', `Failed to fetch market list: ${e.message}`)
        // 这里返回 error 让前端知道网络可能挂了
        return Result.success([])
      }
      log.error('market/list', e)
      return Result.success([])
    }
  }
}
