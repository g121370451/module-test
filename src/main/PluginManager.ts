import { 
  UtilityProcess, 
  BrowserView, 
  MessageChannelMain, 
  BrowserWindow, 
  utilityProcess,
  Rectangle
} from 'electron';
import path from 'path';

// 定义单个插件实例的接口
interface PluginInstance {
  worker: UtilityProcess;
  view: BrowserView;
  active: boolean;
  // 缓存位置信息，方便显隐切换
  bounds: Rectangle; 
}

export class PluginManager {
  private mainWindow: BrowserWindow;
  // 使用 Map 管理实例
  private instances: Map<string, PluginInstance>;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.instances = new Map();
  }

  /**
   * 加载插件 (硬编码路径版)
   * @param pluginPath 插件根目录绝对路径
   */
  public async loadPlugin(pluginPath: string): Promise<string> {
    // 1. 约定：文件夹名即 ID
    const pluginId = path.basename(pluginPath);

    if (this.instances.has(pluginId)) {
      return pluginId;
    }

    console.log(`[PluginManager] Loading ${pluginId} from: ${pluginPath}`);

    // 2. 硬编码路径约定 (注意：运行时加载的必须是编译后的 JS 文件)
    // 如果你的插件也是 TS 开发的，请确保编译输出到了 src/main.js
    const workerEntry = path.join(pluginPath, 'main/index.js');
    const preloadPath = path.join(pluginPath, 'preload/index.js');
    const rendererEntry = path.join(pluginPath, 'renderer/index.html');

    // 3. 启动 Worker (Node 业务进程)
    const worker = utilityProcess.fork(workerEntry, [], {
      serviceName: pluginId,
      stdio: 'pipe',
      env: { 
        ...process.env, 
        PLUGIN_RUN_MODE: 'worker', 
        PLUGIN_ID: pluginId 
      }
    });

    // 类型安全的日志监听
    worker.stdout?.on('data', (d: Buffer) => console.log(`[${pluginId}]: ${d.toString()}`));
    worker.stderr?.on('data', (d: Buffer) => console.error(`[${pluginId} Err]: ${d.toString()}`));

    // 4. 创建 View (UI 渲染层)
    const view = new BrowserView({
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    try {
      await view.webContents.loadFile(rendererEntry);
    } catch (e) {
      console.error(`[${pluginId}] Failed to load UI:`, e);
      worker.kill();
      throw e;
    }

    // 5. 建立直连通道
    const { port1, port2 } = new MessageChannelMain();
    
    // 发送端口
    view.webContents.postMessage('init-port', null, [port1]);
    worker.postMessage({ type: 'connect-to-ui' }, [port2]);

    // 6. 存入管理池
    this.instances.set(pluginId, {
      worker,
      view,
      active: false,
      bounds: { x: 0, y: 0, width: 0, height: 0 }
    });

    return pluginId;
  }

  /**
   * 激活/显示插件
   */
  public activatePlugin(pluginId: string, bounds: Rectangle): void {
    console.log(`[PluginManager] Activating plugin: ${pluginId} with bounds`, bounds);
    const instance = this.instances.get(pluginId);
    if (!instance) return;

    this.mainWindow.addBrowserView(instance.view);
    
    // 设置位置
    instance.view.setBounds(bounds);
    instance.view.setAutoResize({ width: true, height: true });
    
    instance.active = true;
    instance.bounds = bounds;

    // 独占模式：隐藏其他
    this._hideOtherPlugins(pluginId);
  }

  /**
   * 隐藏插件
   */
  public hidePlugin(pluginId: string): void {
    const instance = this.instances.get(pluginId);
    if (instance && instance.active) {
      this.mainWindow.removeBrowserView(instance.view);
      instance.active = false;
    }
  }

  /**
   * 调整大小
   */
  public resizePlugin(pluginId: string, newBounds: Rectangle): void {
    const instance = this.instances.get(pluginId);
    if (instance && instance.active) {
      instance.view.setBounds(newBounds);
      instance.bounds = newBounds;
    }
  }

  private _hideOtherPlugins(currentId: string): void {
    this.instances.forEach((inst, id) => {
      if (id !== currentId && inst.active) {
        this.mainWindow.removeBrowserView(inst.view);
        inst.active = false;
      }
    });
  }
}