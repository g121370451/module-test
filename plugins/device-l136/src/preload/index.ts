import { contextBridge, ipcRenderer } from 'electron'

// 这是一个闭包变量，用来持有端口
let servicePort: MessagePort | null = null;

// 等待主进程 (Dev) 或 宿主 (Prod) 发送端口过来
ipcRenderer.on('init-port', (event) => {
  console.log('[Preload] 收到通信端口');
  servicePort = event.ports[0];

  // 监听来自 Service 的消息，转发给页面
  servicePort.onmessage = (e) => {
    // 通过 window.postMessage 转发给 Vue/React 页面
    window.postMessage({ type: 'plugin-in', payload: e.data }, '*');
  };
});

// 暴露 API 给前端页面
contextBridge.exposeInMainWorld('l136', {
  // 发送指令给 Service
  send: (channel, data) => {
    console.log("asdasdasd")
    if (!servicePort) {
      console.error('端口尚未就绪');
      return;
    }
    servicePort.postMessage({ channel, data });
  },

  // 页面监听 Service 消息 (简单封装)
  onMessage: (callback) => {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'plugin-in') {
        callback(event.data.payload);
      }
    });
  }
});
