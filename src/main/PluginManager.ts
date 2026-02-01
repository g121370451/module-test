import {
  UtilityProcess,
  MessageChannelMain,
  BrowserWindow,
  utilityProcess,
  Rectangle,
  WebContentsView // <--- 1. 引入新类
} from 'electron'
import path from 'path'
import fs from 'fs'
// 定义接口
interface PluginInstance {
  worker: UtilityProcess
  view: WebContentsView // <--- 2. 类型变更为 WebContentsView
  active: boolean
  bounds: Rectangle
}

export class PluginManager {
  private mainWindow: BrowserWindow
  private instances: Map<string, PluginInstance>

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.instances = new Map()
  }

  /**
   * 加载插件
   */
  public async loadPlugin(pluginPath: string): Promise<string> {
    const pluginId = path.basename(pluginPath)
    if (this.instances.has(pluginId)) return pluginId

    console.log(`[PluginManager] Loading ${pluginId}...`)

    const workerEntry = path.join(pluginPath, 'main/index.js')
    const preloadPath = path.join(pluginPath, 'preload/index.js')
    const rendererEntry = path.join(pluginPath, 'renderer/index.html')
    console.log(
      `workerEntry: ${workerEntry}, preloadPath: ${preloadPath}, rendererEntry: ${rendererEntry}`
    )
    console.log('------------------------------------------------')
    const absolutePluginPath = path.resolve(process.cwd(), preloadPath)
    console.log('正在加载 Preload:', absolutePluginPath)
    console.log('文件是否存在:', fs.existsSync(absolutePluginPath)) // 必须为 true
    console.log('------------------------------------------------')
    // 1. 启动 Worker (保持不变)
    const worker = utilityProcess.fork(workerEntry, [], {
      serviceName: pluginId,
      stdio: 'pipe',
      env: {
        ...process.env,
        PLUGIN_ENV: 'production',
        PLUGIN_ID: pluginId,
        PLUGIN_RUN_MODE: 'worker'
      }
    })
    worker.stdout?.on('data', (d: Buffer) => console.log(`[${pluginId}]: ${d.toString()}`))
    worker.stderr?.on('data', (d: Buffer) => console.error(`[${pluginId} Err]: ${d.toString()}`))
    // 2. 创建 View (使用 WebContentsView)
    // 注意：WebContentsView 的构造函数传参方式与 BrowserView 几乎一致
    const view = new WebContentsView({
      webPreferences: {
        preload: absolutePluginPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    // 加载页面
    await view.webContents.loadFile(rendererEntry)

    // 设置背景色，避免加载时闪烁透明
    // view.setBackgroundColor('#2b2b2b');

    // 3. 建立通信 (保持不变)
    const { port1, port2 } = new MessageChannelMain()
    console.log(`view is ${JSON.stringify(view)}`)
    view.webContents.postMessage('init-port', null, [port1])
    worker.postMessage({ type: 'connect-to-ui' }, [port2])

    this.instances.set(pluginId, {
      worker,
      view,
      active: false,
      bounds: { x: 0, y: 0, width: 300, height: 300 }
    })

    return pluginId
  }

  /**
   * 激活/显示插件 (适配 WebContentsView)
   */
  public activatePlugin(pluginId: string, bounds: Rectangle): void {
    console.log(`[PluginManager] Activating ${pluginId}`, bounds)
    const instance = this.instances.get(pluginId)
    if (!instance) return

    // --- 核心修改开始 ---

    // 1. 获取主窗口的内容容器
    // BrowserWindow 继承自 BaseWindow，拥有 contentView 属性
    const contentView = this.mainWindow.contentView

    // 2. 将插件视图添加为子视图
    // 相当于以前的 addBrowserView，但现在是操作 View 树
    contentView.addChildView(instance.view)

    // 3. 设置位置
    instance.view.setBounds({ x: 0, y: 0, width: 300, height: 300 })

    // 注意：WebContentsView 没有 setAutoResize。
    // 我们依赖 Vue 前端的 ResizeObserver 发送 update-bounds 事件来手动调整大小。
    // instance.view.setAutoResize(...) <--- 已移除

    // --- 核心修改结束 ---

    instance.active = true
    instance.bounds = { x: 0, y: 0, width: 300, height: 300 }

    this._hideOtherPlugins(pluginId)
  }

  /**
   * 隐藏插件
   */
  public hidePlugin(pluginId: string): void {
    const instance = this.instances.get(pluginId)
    if (instance && instance.active) {
      // 从内容容器中移除视图
      this.mainWindow.contentView.removeChildView(instance.view)
      instance.active = false
    }
  }

  /**
   * 调整大小
   */
  public resizePlugin(pluginId: string, newBounds: Rectangle): void {
    const instance = this.instances.get(pluginId)
    // 只有宽高有效时才更新，WebContentsView 对 0x0 的处理可能导致绘制问题
    if (instance && instance.active && newBounds.width > 0 && newBounds.height > 0) {
      instance.view.setBounds(newBounds)
      instance.bounds = newBounds
    }
  }

  private _hideOtherPlugins(currentId: string): void {
    this.instances.forEach((inst, id) => {
      if (id !== currentId && inst.active) {
        // 移除其他插件的视图
        this.mainWindow.contentView.removeChildView(inst.view)
        inst.active = false
      }
    })
  }
}
