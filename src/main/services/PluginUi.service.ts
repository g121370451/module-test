import { BrowserWindow, MessageChannelMain, WebContentsView, app, utilityProcess } from 'electron'
import path from 'path'
import { log } from '../modules/log'
import { MountUIRequest, PluginUIRect } from '../../preload/types/plugin'
import { PluginViewItem, UIInstance } from '../../preload/types/market'
// 定义 UI 实例类型联合
export class PluginService {
  private static instance: PluginService

  // 持有主窗口引用，用于挂载 BrowserView
  private mainWindow: BrowserWindow | null = null

  // 存储活跃的 UI 实例：Key 是 "pluginId"
  private activeUIs: Map<string, PluginViewItem> = new Map()

  private constructor() {
    /* empty */
  }

  public static getInstance(): PluginService {
    if (!PluginService.instance) {
      PluginService.instance = new PluginService()
    }
    return PluginService.instance
  }

  /**
   * 初始化：绑定主窗口
   */
  public setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win
  }

  /**
   * 挂载/显示插件 UI
   */
  public async mountUI(params: MountUIRequest): Promise<void> {
    const { pluginId, version, mode, bounds } = params

    // 1. 检查是否已经存在
    if (this.activeUIs.has(pluginId)) {
      log.info(`Plugin UI for ${pluginId} is already active. Focusing...`)
      this.focusUI(pluginId)
      return
    }
    log.debug('123123123')
    // 2. 解析 ASAR 内的路径
    const { htmlPath, workPath, preloadPath } = this.resolvePaths(pluginId, version)
    try {
      let ui: UIInstance

      if (mode === 'window') {
        ui = await this.createWindow(htmlPath, preloadPath)
      } else {
        if (!this.mainWindow) throw new Error('Main window not initialized')
        if (!bounds) throw new Error('Bounds required for View mode')
        ui = await this.createView(htmlPath, preloadPath, bounds)
      }

      // 3. 监听销毁事件 (清理 Map)
      this.bindCleanup(pluginId, ui)
      // 4. 启动worker进程
      const worker = utilityProcess.fork(workPath, [], {
        serviceName: pluginId,
        stdio: 'pipe',
        env: {
          ...process.env,
          PLUGIN_ENV: 'production',
          PLUGIN_ID: pluginId,
          PLUGIN_VERSION: version,
          PLUGIN_RUN_MODE: 'worker',
          // HOST_LIBS_PATH: hostLibsPath // 注入宿主库路径，实现共享加载
        }
      });

      worker.stdout?.on('data', (d: Buffer) => log.info(`[${pluginId}]: ${d.toString()}`));
      worker.stderr?.on('data', (d: Buffer) => log.error(`[${pluginId} Err]: ${d.toString()}`));

      const { port1, port2 } = new MessageChannelMain();

      // 确保 WebContents 加载完成后再发消息，防止 Preload 错过 init-port
      const wc = ui instanceof BrowserWindow ? ui.webContents : ui.webContents;

      wc.postMessage('init-port', null, [port1]);
      // 将另一端发给 Worker
      worker.postMessage({ type: 'connect-to-ui' }, [port2]);
      worker.postMessage({ type: 'deps:update', payload: [{ alias: 'ffmplayer-core', path: 'E:\\project\\deepcool\\nodejs\\module-test\\plugins\\ffmpeg-core', version: 'v1.0.0' }]}, [port2]);
      // 5. 持久化
      const pluginItem = {
        ui,
        worker
      }
      // 3. 存入管理 Map
      this.activeUIs.set(pluginId, pluginItem)
      log.info(`[PluginUI] Mounted ${pluginId} in ${mode} mode`)
    } catch (e: unknown) {
      const err = e as Error
      throw new Error(`Failed to mount UI: ${err.message}`)
    }
  }

  /**
   * 卸载/关闭插件 UI
   */
  public async unmountUI(pluginId: string): Promise<void> {
    const pluginItem = this.activeUIs.get(pluginId)
    if (!pluginItem) {
      log.warn(`[PluginUI] No active UI found for ${pluginId} to unmount`)
      return
    }
    const { ui, worker } = pluginItem;
    if (worker) {
      worker.kill(); // 停止 Node 逻辑
      log.debug(`[PluginUI] Worker for ${pluginId} killed.`);
    }
    if (ui) {
      if (ui instanceof BrowserWindow) {
        if (!ui.isDestroyed()) ui.close()
      } else if (ui instanceof WebContentsView) {
        // 移除 View
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.contentView.removeChildView(ui)
        }
        // @ts-ignore 隐藏接口 销毁content
        ui.webContents.destroy()
      }

      this.activeUIs.delete(pluginId)
      log.info(`[PluginUI] Unmounted ${pluginId}`)
    }
  }

  // ================= 私有辅助方法 =================

  /**
   * 创建独立窗口
   */
  private async createWindow(htmlPath: string, preloadPath: string): Promise<BrowserWindow> {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      autoHideMenuBar: true,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    await win.loadURL(`${htmlPath}`)
    return win
  }

  /**
   * 创建嵌入式 View (WebContentsView)
   */
  private async createView(
    htmlPath: string,
    preloadPath: string,
    bounds: PluginUIRect
  ): Promise<WebContentsView> {
    if (!this.mainWindow) throw new Error('Main Window is null')

    const view = new WebContentsView({
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false // 防止后台时变慢
      }
    })

    // 设置初始位置
    view.setBounds(bounds)
    view.setBackgroundColor('#1e1e1e') // 防止加载时白屏

    // 挂载到主窗口
    this.mainWindow.contentView.addChildView(view)

    await view.webContents.loadURL(`${htmlPath}`)
    return view
  }

  /**
   * 解析路径 (支持 ASAR)
   */
  private resolvePaths(
    pluginId: string,
    version: string
  ): {
    htmlPath: string,
    workPath: string,
    preloadPath: string
  } {
    const userData = app.getPath('userData')
    // C:/.../plugins/l136/1.2.0/plugin.asar
    const asarRoot = path.join(userData, 'plugins', pluginId, version, 'app.asar')

    // 假设插件构建结构是 dist/renderer/index.html 和 dist/preload.js
    // 你需要根据你的实际 Vite 构建配置调整这里
    const htmlPath = path.join(asarRoot, 'out', 'renderer', 'index.html')
    const workPath = path.join(asarRoot, 'out', 'main', 'index.js')
    const preloadPath = path.join(asarRoot, 'out', 'preload', 'index.js')
    log.debug(`[PluginUI] Resolved paths for ${pluginId}: HTML=${htmlPath},main=${workPath}, Preload=${preloadPath}`)
    return { htmlPath, workPath, preloadPath }
  }

  /**
   * 聚焦已存在的 UI
   */
  private focusUI(pluginId: string): void {
    const pluginItem = this.activeUIs.get(pluginId)
    if (!pluginItem) {
      log.warn(`[PluginUI] No active UI found for ${pluginId} to focus`)
      return
    }
    const ui = pluginItem.ui
    if (!ui) {
      log.warn(`[PluginUI] UI instance for ${pluginId} is null`)
      return
    }
    if (ui instanceof BrowserWindow) {
      if (ui.isMinimized()) ui.restore()
      ui.focus()
    } else {
      // View 模式下不需要聚焦窗口，可能需要通知前端高亮 Tab
    }
  }

  /**
   * 绑定清理逻辑 (当用户点击窗口关闭按钮时自动清理 Map)
   */
  private bindCleanup(id: string, ui: UIInstance): void {
    if (ui instanceof BrowserWindow) {
      ui.on('closed', () => {
        this.activeUIs.delete(id)
        log.info(`[PluginUI] Window closed: ${id}`)
      })
    }
    // View 模式通常由前端触发 unmountUI 来关闭，没有原生的关闭按钮
  }
}
