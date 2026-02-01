<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-icon">⚡</span>
        <span class="brand-text">KERNEL</span>
      </div>

      <nav class="nav-menu">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="nav-item"
          :class="{ active: currentTab === tab.id }"
          @click="setCurrentTab(tab.id)"
        >
          <div class="icon" v-html="tab.icon"></div>
          <span class="label">{{ tab.label }}</span>
        </div>
      </nav>

      <div class="status-bar">
        <div class="status-item"><span class="status-dot ok"></span> Host Online</div>
        <div class="version">v1.0.0</div>
      </div>
    </aside>

    <main class="content-area">
      <section v-if="currentTab === 'home'" class="page-view home-view">
        <header class="page-header">
          <h1>控制台概览</h1>
          <p class="subtitle">欢迎回来，Administrator</p>
        </header>

        <div class="dashboard-grid">
          <div class="stat-card">
            <div class="stat-title">系统状态</div>
            <div class="stat-value ok">运行正常</div>
            <div class="stat-desc">内存占用 124MB</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">已加载插件</div>
            <div class="stat-value">2</div>
            <div class="stat-desc">活跃进程</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">外接设备</div>
            <div class="stat-value warning">1</div>
            <div class="stat-desc">COM3 被占用</div>
          </div>
        </div>
      </section>

      <section v-if="currentTab === 'market'" class="page-view">
        <header class="page-header row-header">
          <div>
            <h1>插件市场</h1>
            <p class="subtitle">从云端 (OSS) 获取最新插件</p>
          </div>
          <div class="search-box">
            <input type="text" placeholder="搜索插件..." />
          </div>
        </header>

        <div class="plugin-grid">
          <div v-for="item in marketList" :key="item.id" class="plugin-card">
            <div class="card-icon">{{ item.name.charAt(0).toUpperCase() }}</div>
            <div class="card-body">
              <div class="card-header">
                <h3>{{ item.name }}</h3>
                <span class="version-tag">v{{ item.version }}</span>
              </div>
              <p class="desc">{{ item.desc }}</p>
              <div class="card-footer">
                <span class="info-text">需要: {{ item.deps.join(', ') }}</span>
                <button class="btn btn-primary btn-sm" @click="downloadPlugin(item)">下载</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="currentTab === 'plugins'" class="page-view">
        <header class="page-header">
          <h1>本地插件管理</h1>
          <p class="subtitle">管理本地已安装的插件及其版本</p>
        </header>

        <div class="local-list">
          <div v-for="(group, id) in localPlugins" :key="id" class="plugin-group">
            <div class="group-header">
              <div class="group-title">
                <span class="folder-icon">📂</span>
                {{ group.name }}
                <span class="plugin-id">({{ id }})</span>
              </div>
            </div>

            <div class="version-list">
              <div v-for="ver in group.versions" :key="ver.version" class="version-item">
                <div class="ver-left">
                  <div class="ver-badges">
                    <span class="badge-ver">v{{ ver.version }}</span>
                    <span v-if="ver.status === 'running'" class="badge-status running"
                      >RUNNING</span
                    >
                    <span v-else class="badge-status stopped">STOPPED</span>
                  </div>
                  <div class="ver-path">{{ ver.path }}</div>
                </div>

                <div class="ver-actions">
                  <template v-if="ver.status === 'running'">
                    <button class="btn btn-outline btn-sm" @click="showPluginUI(ver)">
                      显示界面
                    </button>
                    <button class="btn btn-danger btn-sm" @click="stopPlugin(ver)">停止</button>
                  </template>
                  <template v-else>
                    <button class="btn btn-success btn-sm" @click="runPlugin(ver)">启动</button>
                    <button class="btn btn-text btn-sm text-muted">卸载</button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="currentTab === 'devices'" class="page-view">
        <header class="page-header">
          <h1>设备管理器</h1>
          <p class="subtitle">监控串口、USB 及虚拟设备</p>
        </header>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>设备 ID</th>
                <th>描述</th>
                <th>状态</th>
                <th>占用插件</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-mono">USB\VID_1234&PID_5678</td>
                <td>L136 高压测试仪</td>
                <td><span class="status-text ok">● 在线</span></td>
                <td>plugin-l136</td>
                <td><button class="btn btn-text btn-sm">断开</button></td>
              </tr>
              <tr>
                <td class="font-mono">COM3</td>
                <td>L086 频谱分析仪</td>
                <td><span class="status-text error">● 占用</span></td>
                <td>plugin-l086</td>
                <td><button class="btn btn-text btn-sm">断开</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue'

// --- 类型定义 (Interface) ---
// 放在这里或单独的 types.ts 文件中
interface TabItem {
  id: string
  label: string
  icon: string
}

interface MarketItem {
  id: string
  name: string
  desc: string
  version: string
  deps: string[]
}

interface LocalVersion {
  version: string
  path: string
  status: 'running' | 'stopped' | 'error'
}

interface LocalPluginGroup {
  name: string
  versions: LocalVersion[]
}

interface LocalPluginMap {
  [key: string]: LocalPluginGroup
}

export default defineComponent({
  name: 'AppLayout',
  setup() {
    // 1. 状态定义
    const currentTab = ref<string>('home')

    // SVG 图标数据 (保持代码整洁，折叠起来)
    const tabs: TabItem[] = [
      {
        id: 'home',
        label: '概览',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>'
      },
      {
        id: 'market',
        label: '插件市场',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
      },
      {
        id: 'plugins',
        label: '已安装',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 8h-8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z"/></svg>'
      },
      {
        id: 'devices',
        label: '设备',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 7v4h1v2h-3V5h2l-3-3-3 3h2v8H5v-2h1V7H5l-3 3 3 3h1v-2h9v2h1l3-3-3-3z"/></svg>'
      }
    ]

    // 模拟市场数据
    const marketList = ref<MarketItem[]>([
      {
        id: 'p1',
        name: 'plugin-l136',
        desc: 'L136 高压设备测试套件，支持实时电压回传与波形绘制。',
        version: '1.2.0',
        deps: ['serialport', 'sqlite3']
      },
      {
        id: 'p2',
        name: 'plugin-l086',
        desc: 'L086 频谱分析组件，包含 FFT 算法库。',
        version: '2.0.1',
        deps: ['fft-js']
      }
    ])

    // 模拟本地数据 (Reactive Object)
    const localPlugins = reactive<LocalPluginMap>({
      'plugin-l136': {
        name: 'L136 高压测试',
        versions: [
          { version: '1.2.0', path: 'D:\\Plugins\\l136\\1.2.0', status: 'running' },
          { version: '1.1.0', path: 'D:\\Plugins\\l136\\1.1.0', status: 'stopped' }
        ]
      },
      'plugin-l086': {
        name: 'L086 频谱仪',
        versions: [{ version: '2.0.0', path: 'D:\\Plugins\\l086\\2.0.0', status: 'stopped' }]
      }
    })

    // 2. 方法定义
    const setCurrentTab = (id: string): void => {
      currentTab.value = id
    }

    const downloadPlugin = (item: MarketItem): void => {
      console.log('Downloading:', item.name)
      // 实际逻辑：IPC 调用
    }

    const runPlugin = (ver: LocalVersion): void => {
      ver.status = 'running'
      console.log('Mounting plugin version:', ver.version)
      // 实际逻辑：window.electronAPI.mountPlugin(ver.path)
    }

    const stopPlugin = (ver: LocalVersion): void => {
      ver.status = 'stopped'
      console.log('Unmounting plugin version:', ver.version)
      // 实际逻辑：window.electronAPI.unmountPlugin(...)
    }

    const showPluginUI = (ver: LocalVersion): void => {
      console.log('Focusing UI:', ver.version)
    }

    // 3. 返回给模板
    return {
      currentTab,
      tabs,
      marketList,
      localPlugins,
      setCurrentTab,
      downloadPlugin,
      runPlugin,
      stopPlugin,
      showPluginUI
    }
  }
})
</script>

<style scoped>
/* ----------------------------------
   基础变量与重置
---------------------------------- */
:root {
  --bg-sidebar: #1e1e1e;
  --bg-content: #121212;
  --bg-card: #252526;
  --bg-hover: #2a2d2e;
  --bg-active: #37373d;
  --text-primary: #ccccc7;
  --text-secondary: #858585;
  --accent: #007acc;
  --accent-hover: #0062a3;
  --success: #89d185;
  --error: #f48771;
  --warning: #cca700;
  --border: #333333;
}

.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-content);
  color: var(--text-primary);
  font-family: 'Segoe UI', system-ui, sans-serif;
  overflow: hidden;
}

/* ----------------------------------
   左侧侧边栏 (VS Code 风格)
---------------------------------- */
.sidebar {
  width: 240px;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  user-select: none;
}

.brand {
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #fff;
  border-bottom: 1px solid var(--border);
}
.brand-icon {
  margin-right: 10px;
  color: var(--accent);
}

.nav-menu {
  flex: 1;
  padding: 10px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  color: var(--text-secondary);
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background-color: var(--bg-active);
  color: #fff;
  border-left-color: var(--accent);
}

.nav-item .icon {
  width: 18px;
  height: 18px;
  margin-right: 12px;
  display: flex;
}

.status-bar {
  height: 30px;
  background-color: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  font-size: 12px;
}
.status-item {
  display: flex;
  align-items: center;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  margin-right: 6px;
}

/* ----------------------------------
   右侧内容区
---------------------------------- */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden; /* 关键：防止滚动条溢出 */
}

.page-view {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 30px;
}
.page-header h1 {
  margin: 0 0 5px 0;
  font-size: 24px;
  font-weight: 500;
  color: #fff;
}
.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}
.row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 搜索框 */
.search-box input {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: #fff;
  padding: 8px 15px;
  border-radius: 4px;
  width: 250px;
  outline: none;
}
.search-box input:focus {
  border-color: var(--accent);
}

/* ----------------------------------
   组件样式: 仪表盘卡片
---------------------------------- */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}
.stat-card {
  background: var(--bg-card);
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 6px;
}
.stat-title {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.stat-value {
  font-size: 28px;
  font-weight: 300;
  color: #fff;
  margin-bottom: 5px;
}
.stat-value.ok {
  color: var(--success);
}
.stat-value.warning {
  color: var(--warning);
}
.stat-desc {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.7;
}

/* ----------------------------------
   组件样式: 插件卡片 (市场)
---------------------------------- */
.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.plugin-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  display: flex;
  overflow: hidden;
  transition: transform 0.2s;
}
.plugin-card:hover {
  border-color: var(--accent);
}

.card-icon {
  width: 60px;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #aaa;
}
.card-body {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.version-tag {
  font-size: 11px;
  background: #333;
  padding: 2px 6px;
  border-radius: 3px;
}
.desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 15px 0;
  line-height: 1.4;
  flex: 1;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

/* ----------------------------------
   组件样式: 本地列表 (多版本)
---------------------------------- */
.plugin-group {
  margin-bottom: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
}
.group-header {
  padding: 10px 15px;
  border-bottom: 1px solid var(--border);
  background: #2a2d2e;
}
.group-title {
  font-weight: 600;
  display: flex;
  align-items: center;
}
.folder-icon {
  margin-right: 8px;
}
.plugin-id {
  margin-left: 8px;
  font-weight: normal;
  color: var(--text-secondary);
  font-size: 12px;
  font-family: monospace;
}

.version-list {
  display: flex;
  flex-direction: column;
}
.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid var(--border);
}
.version-item:last-child {
  border-bottom: none;
}

.ver-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ver-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}
.badge-ver {
  font-weight: bold;
  color: #fff;
}
.badge-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 2px;
  font-weight: bold;
}
.badge-status.running {
  background: rgba(137, 209, 133, 0.2);
  color: var(--success);
}
.badge-status.stopped {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}
.ver-path {
  font-size: 12px;
  color: #666;
  font-family: 'Consolas', monospace;
}

.ver-actions {
  display: flex;
  gap: 8px;
}

/* ----------------------------------
   组件样式: 表格
---------------------------------- */
.table-container {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table th {
  background: #2a2d2e;
  text-align: left;
  padding: 12px 15px;
  font-weight: normal;
  color: var(--text-secondary);
}
.data-table td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
}
.data-table tr:last-child td {
  border-bottom: none;
}
.font-mono {
  font-family: 'Consolas', monospace;
  color: var(--accent);
}
.status-text.ok {
  color: var(--success);
}
.status-text.error {
  color: var(--error);
}

/* ----------------------------------
   通用按钮
---------------------------------- */
.btn {
  border: none;
  cursor: pointer;
  border-radius: 4px;
  padding: 6px 16px;
  font-size: 13px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}
.btn-primary {
  background: var(--accent);
  color: #fff;
}
.btn-primary:hover {
  background: var(--accent-hover);
}
.btn-success {
  background: #388e3c;
  color: #fff;
}
.btn-success:hover {
  background: #2e7d32;
}
.btn-danger {
  background: #d32f2f;
  color: #fff;
}
.btn-danger:hover {
  background: #c62828;
}
.btn-outline {
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
}
.btn-outline:hover {
  border-color: #888;
  color: #fff;
}
.btn-text {
  background: transparent;
  color: var(--text-secondary);
  padding: 0;
}
.btn-text:hover {
  color: #fff;
  text-decoration: underline;
}
.text-muted {
  color: #555;
}
</style>
