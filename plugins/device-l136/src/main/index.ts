import { join } from 'path'
import { L136Service } from './L136Service'
// ⚠️ 关键技巧 1：只导入 Electron 的类型接口
// "import type" 会在编译成 JS 后被完全删除，所以不会在 Node 环境报错
import type { BrowserWindow as BrowserWindowType } from 'electron'

// ⚠️ 关键技巧 2：Vite 资源导入通常编译为字符串路径，放在顶层是安全的
// 只要确保 icon.png?asset 这种写法在你的 env.d.ts 里定义过
import icon from '../../resources/icon.png?asset'

// 自定义环境判断，不依赖 @electron-toolkit
const isRunAsWorker = process.env['PLUGIN_RUN_MODE'] === 'worker'
const isDev =
  !isRunAsWorker &&
  (process.env.NODE_ENV === 'development' || !!process.env['ELECTRON_RENDERER_URL'])
if (isDev) {
  // ============================================================
  // 【Dev 模式】：Electron 主进程环境
  // ============================================================
  console.log('[Mode] Development (Standalone Electron)')

  // ⚠️ 关键技巧 3：在 if 块内部动态 require
  // 只有进入这个块，electron 模块才会被加载

  const { app, BrowserWindow, shell, MessageChannelMain } = require('electron')

  // 如果你想用 electron-toolkit 的功能，也必须在这里动态引入
  // const { electronApp, optimizer } = require('@electron-toolkit/utils')

  function createWindow(): void {
    const mainWindow: BrowserWindowType = new BrowserWindow({
      width: 900,
      height: 670,
      show: false,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true
      }
    })

    mainWindow.on('ready-to-show', () => {
      mainWindow?.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    // 建立通信通道
    const { port1, port2 } = new MessageChannelMain()

    // 发送给渲染进程
    mainWindow.webContents.postMessage('init-port', null, [port1])

    // 启动服务 (Port2 是 MessagePortMain 类型)
    new L136Service(port2)

    if (process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  app.whenReady().then(() => {
    // 动态引入 toolkit 的功能 (可选)
    // require('@electron-toolkit/utils').electronApp.setAppUserModelId('com.electron')

    createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
} else {
  // ============================================================
  // 【Prod 模式】：纯 Node.js 子进程环境
  // ============================================================
  console.log('[Mode] Production (Node Worker)')

  // 这里的 process 是 NodeJS.Process
  if (process.parentPort) {
    process.parentPort.on('message', (e: Electron.MessageEvent) => {
      const msg = e.data

      if (msg.type === 'connect-to-ui') {
        // 在 Node 环境下，e.ports[0] 是 Node 的 MessagePort 类型
        // 虽然它和 Electron 的 MessagePortMain 类型定义不同，但功能兼容
        const port2 = e.ports[0]
        console.log(`ports is ${JSON.stringify(port2)}`)
        // 我们在下面会处理 L136Service 的类型兼容性
        new L136Service(port2)

        console.log('[Plugin Worker] 已接收端口并启动服务')
      }
    })
  }
}
