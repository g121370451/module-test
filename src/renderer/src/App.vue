<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="brand">⚡ Kernel</div>

      <nav class="nav-menu">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="nav-item"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          <span class="icon" v-html="tab.icon"></span>
          <span class="label">{{ tab.label }}</span>
        </div>
      </nav>

      <div class="status-bar">Host v1.0.0 (Prod)</div>
    </aside>

    <main class="content-area">
      <section v-if="currentTab === 'home'" class="page-view home-view">
        <h1>欢迎回来，开发者</h1>
        <div class="dashboard-grid">
          <div class="card">
            <h3>系统状态</h3>
            <p class="ok">正常运行</p>
          </div>
          <div class="card">
            <h3>运行插件</h3>
            <p>2 个</p>
          </div>
          <div class="card">
            <h3>连接设备</h3>
            <p>1 台</p>
          </div>
        </div>
      </section>

      <section v-if="currentTab === 'market'" class="page-view">
        <header>
          <h2>插件市场 (OSS)</h2>
          <input type="text" placeholder="搜索插件..." class="search-input" />
        </header>
        <div class="plugin-grid">
          <div v-for="item in marketList" :key="item.id" class="plugin-card">
            <div class="card-icon">{{ item.name[0] }}</div>
            <div class="card-info">
              <h3>{{ item.name }}</h3>
              <p>{{ item.desc }}</p>
              <div class="card-meta">
                <span class="tag">{{ item.version }}</span>
                <button class="btn-primary" @click="downloadPlugin(item)">下载</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="currentTab === 'plugins'" class="page-view">
        <header><h2>已安装插件 (本地)</h2></header>

        <div class="local-list">
          <div v-for="(group, id) in localPlugins" :key="id" class="plugin-group">
            <div class="group-header">
              <span class="group-title">🧩 {{ group.name }} ({{ id }})</span>
            </div>

            <div class="version-list">
              <div v-for="ver in group.versions" :key="ver.version" class="version-item">
                <div class="ver-info">
                  <span class="ver-num">v{{ ver.version }}</span>
                  <span class="ver-path">{{ ver.path }}</span>
                </div>
                <div class="ver-actions">
                  <span v-if="ver.status === 'running'" class="status-dot running"></span>
                  <button v-if="ver.status === 'stopped'" class="btn-sm" @click="runPlugin(ver)">
                    启动
                  </button>
                  <button v-else class="btn-sm btn-danger" @click="stopPlugin(ver)">停止</button>

                  <button
                    v-if="ver.status === 'running'"
                    class="btn-sm btn-outline"
                    @click="showPluginUI(ver)"
                  >
                    显示界面
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="plugin-placeholder-area">
          <p>（点击“显示界面”后，插件 UI 将覆盖此区域）</p>
        </div>
      </section>

      <section v-if="currentTab === 'devices'" class="page-view">
        <header><h2>设备管理器</h2></header>
        <table class="data-table">
          <thead>
            <tr>
              <th>设备ID</th>
              <th>类型</th>
              <th>状态</th>
              <th>所属插件</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>USB\VID_1234&PID_5678</td>
              <td>L136 高压表</td>
              <td class="ok">在线</td>
              <td>plugin-l136</td>
            </tr>
            <tr>
              <td>COM3</td>
              <td>L086 频谱仪</td>
              <td class="err">占用中</td>
              <td>plugin-l086</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// 1. 导航配置
const currentTab = ref('home')
const tabs = [
  {
    id: 'home',
    label: '首页',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>'
  },
  {
    id: 'market',
    label: '插件市场',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
  },
  {
    id: 'plugins',
    label: '插件列表',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>'
  },
  {
    id: 'devices',
    label: '设备列表',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>'
  }
]

// 2. 模拟数据：市场
const marketList = ref([
  { id: 'p1', name: 'plugin-l136', desc: '高压设备测试套件', version: '1.2.0' },
  { id: 'p2', name: 'plugin-l086', desc: '频谱分析显示组件', version: '2.0.1' },
  { id: 'p3', name: 'plugin-cam', desc: '通用工业相机驱动', version: '0.9.5' }
])

// 3. 模拟数据：本地已安装 (支持多版本)
// 结构：Map<PluginID, { name, versions: [] }>
const localPlugins = reactive({
  'plugin-l136': {
    name: 'L136 设备插件',
    versions: [
      { version: '1.2.0', path: 'D:/Plugins/l136/1.2.0', status: 'running' }, // 正在运行
      { version: '1.1.0', path: 'D:/Plugins/l136/1.1.0', status: 'stopped' } // 旧版本
    ]
  },
  'plugin-l086': {
    name: 'L086 频谱插件',
    versions: [{ version: '2.0.0', path: 'D:/Plugins/l086/2.0.0', status: 'stopped' }]
  }
})

// 4. 交互逻辑
const downloadPlugin = (item: { name: string; version: string }): void => {
  alert(`模拟：从 OSS 下载 ${item.name} v${item.version} 的 ZIP 包...`)
  // 实际逻辑：ipcRenderer.invoke('download-plugin', item.url)
}

const runPlugin = (ver: { version: string; path: string; status: string }): void => {
  ver.status = 'running'
  // 实际逻辑：window.electronAPI.mountPlugin(ver.path)
}

const stopPlugin = (ver: { version: string; path: string; status: string }): void => {
  ver.status = 'stopped'
  // 实际逻辑：window.electronAPI.unmountPlugin(...)
}

const showPluginUI = (ver: { version: string; path: string; status: string }): void => {
  console.log('显示界面', ver)
  // 这里应该触发 PluginContainer 组件的激活
}
</script>

<style>
/* 全局重置 */
body {
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
  background: #1e1e1e;
  color: #e0e0e0;
}

/* 布局框架 */
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 左侧侧边栏 (VS Code Style) */
.sidebar {
  width: 240px;
  background: #252526;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
}
.brand {
  height: 50px;
  display: flex;
  align-items: center;
  padding-left: 20px;
  font-weight: bold;
  color: #42b983;
  font-size: 1.1em;
  border-bottom: 1px solid #333;
}
.nav-menu {
  flex: 1;
  padding-top: 10px;
}
.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
}
.nav-item:hover {
  background: #2a2d2e;
  color: #fff;
}
.nav-item.active {
  background: #37373d;
  color: #fff;
  border-left: 3px solid #42b983;
}
.nav-item .icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
}
.nav-item .icon svg {
  width: 100%;
  height: 100%;
}
.status-bar {
  padding: 10px 20px;
  font-size: 0.8em;
  color: #666;
  border-top: 1px solid #333;
}

/* 右侧内容区 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}
.page-view {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
h1,
h2,
h3 {
  margin: 0;
  color: #fff;
}

/* 首页卡片 */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}
.card {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #3e3e3e;
}
.ok {
  color: #42b983;
  font-weight: bold;
}

/* 插件市场 Grid */
.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.plugin-card {
  background: #2d2d2d;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  gap: 15px;
  border: 1px solid #3e3e3e;
}
.card-icon {
  width: 50px;
  height: 50px;
  background: #3e3e3e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #aaa;
  border-radius: 6px;
}
.card-info {
  flex: 1;
}
.card-info h3 {
  font-size: 16px;
  margin-bottom: 5px;
}
.card-info p {
  font-size: 12px;
  color: #888;
  margin-bottom: 10px;
}
.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tag {
  font-size: 12px;
  background: #3e3e3e;
  padding: 2px 6px;
  border-radius: 4px;
  color: #ccc;
}

/* 插件列表 (版本管理) */
.plugin-group {
  margin-bottom: 20px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #252526;
  overflow: hidden;
}
.group-header {
  padding: 10px 15px;
  background: #2d2d2d;
  border-bottom: 1px solid #333;
  font-weight: bold;
}
.version-list {
}
.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #333;
}
.version-item:last-child {
  border-bottom: none;
}
.ver-info {
  display: flex;
  flex-direction: column;
}
.ver-num {
  color: #fff;
  font-weight: bold;
}
.ver-path {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}
.ver-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}
.status-dot.running {
  background: #42b983;
  box-shadow: 0 0 5px #42b983;
}

/* 按钮样式 */
button {
  cursor: pointer;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  transition: opacity 0.2s;
}
button:hover {
  opacity: 0.8;
}
.btn-primary {
  background: #007acc;
  color: white;
}
.btn-danger {
  background: #d9534f;
  color: white;
}
.btn-outline {
  background: transparent;
  border: 1px solid #666;
  color: #ccc;
}
.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

/* 表格样式 */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #2d2d2d;
}
.data-table th,
.data-table td {
  text-align: left;
  padding: 10px;
  border-bottom: 1px solid #3e3e3e;
}
.data-table th {
  background: #333;
  color: #aaa;
  font-weight: normal;
}
.err {
  color: #d9534f;
}
</style>
