<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="logo-area"><span class="logo-icon">⚡</span> KERNEL</div>

      <nav class="nav">
        <div v-for="tab in tabs" :key="tab.id" class="nav-item" :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id">
          <span class="nav-icon" v-html="tab.icon"></span>
          <span class="nav-label">{{ tab.label }}</span>
        </div>
      </nav>

      <div class="user-profile">
        <div class="avatar">A</div>
        <div class="user-info">
          <div class="name">Admin</div>
          <div class="role">Developer</div>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <transition name="fade" mode="out-in">
        <keep-alive>
          <component :is="currentViewComponent" v-bind="currentProps" @download="handleDownload" @run="handleRun"
            @stop="handleStop" @ui="handleUI" />
        </keep-alive>
      </transition>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import HomeView from './views/HomeView.vue'
import MarketView from './views/MarketView.vue'
import LocalView from './views/LocalView.vue'
import DevicesView from './views/DevicesView.vue'
import { LocalVersion, LocalPluginGroup, DeviceItem } from './types'

export default defineComponent({
  name: 'App',
  components: { HomeView, MarketView, LocalView, DevicesView },
  setup() {
    const currentTab = ref('home')

    // Tab 配置
    const tabs = [
      { id: 'home', label: '概览', icon: '🏠' }, // 实际可用 SVG
      { id: 'market', label: '插件市场', icon: '🛍️' },
      { id: 'local', label: '本地插件', icon: '🧩' },
      { id: 'devices', label: '设备管理', icon: '🔌' }
    ]

    // --- 数据状态 (实际应来自 Store 或 API) ---
    const marketData = ref<MarketItem[]>([
      {
        id: 'p1',
        name: 'plugin-l136',
        desc: 'L136 高压测试套件',
        version: '1.2.0',
        url: 'https://your-oss-bucket.com/plugins/l136/1.2.0.zip',
        deps: ['serialport'],
      },
      {
        id: 'p2',
        name: 'plugin-fft',
        desc: '频谱分析算法库',
        url: "https://your-oss-bucket.com/plugins/fft/2.0.0.zip",
        version: '2.0.0',
        deps: []
      }
    ])

    const localData = ref<LocalPluginGroup[]>([
      {
        id: 'plugin-l136',
        name: 'L136 插件',
        versions: [
          { version: '1.2.0', path: '/plugins/l136/1.2.0', status: 'running' },
          { version: '1.0.0', path: '/plugins/l136/1.0.0', status: 'stopped' }
        ]
      }
    ])

    const deviceData = ref<DeviceItem[]>([
      { id: 'COM3', desc: 'L136 Analyzer', status: 'online', pluginId: 'plugin-l136' }
    ])

    // --- 计算属性：决定当前渲染哪个组件 ---
    const currentViewComponent = computed(() => {
      switch (currentTab.value) {
        case 'home':
          return 'HomeView'
        case 'market':
          return 'MarketView'
        case 'local':
          return 'LocalView'
        case 'devices':
          return 'DevicesView'
        default:
          return 'HomeView'
      }
    })

    // --- 计算属性：传递给子组件的 Props ---
    const currentProps = computed(() => {
      switch (currentTab.value) {
        case 'market':
          return { list: marketData.value }
        case 'local':
          return { list: localData.value }
        case 'devices':
          return { list: deviceData.value }
        default:
          return {}
      }
    })

    // --- 事件处理 ---
    const handleDownload = (item: MarketItem): void => console.log('下载', item.name)
    const handleRun = (ver: LocalVersion): void => {
      ver.status = 'running'
    }
    const handleStop = (ver: LocalVersion): void => {
      ver.status = 'stopped'
    }
    const handleUI = (ver: LocalVersion): void => console.log('打开界面', ver)

    return {
      currentTab,
      tabs,
      currentViewComponent,
      currentProps,
      handleDownload,
      handleRun,
      handleStop,
      handleUI
    }
  }
})
</script>

<style>
/* --- 全局样式变量 (CSS Variables) --- */
:root {
  --bg-app: #121212;
  /* 整体背景 */
  --bg-sidebar: #1e1e1e;
  /* 侧边栏背景 */
  --surface: #1e1e1e;
  /* 卡片背景 */
  --surface-light: #252526;
  /* 稍微亮一点的背景 */
  --border: #333333;
  /* 边框颜色 */
  --primary: #42b983;
  /* 主色调 (Vue绿) */
  --text-main: #e0e0e0;
  /* 主文字 */
  --text-sub: #858585;
  /* 次要文字 */
  --success: #89d185;
  --warning: #cca700;
  --danger: #f48771;
}

body {
  margin: 0;
  font-family:
    'Inter',
    -apple-system,
    sans-serif;
  background: var(--bg-app);
  color: var(--text-main);
}

/* App 布局 */
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 240px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--border);
}

.logo-icon {
  color: var(--primary);
  margin-right: 8px;
}

.nav {
  flex: 1;
  padding: 16px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-sub);
  transition: all 0.2s;
  margin-bottom: 4px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.nav-item.active {
  background: rgba(66, 185, 131, 0.15);
  color: var(--primary);
  font-weight: 500;
}

.nav-icon {
  margin-right: 12px;
  font-size: 16px;
}

.user-profile {
  padding: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 32px;
  height: 32px;
  background: var(--primary);
  color: #000;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: bold;
}

.user-info .name {
  font-size: 14px;
  font-weight: 500;
}

.user-info .role {
  font-size: 11px;
  color: var(--text-sub);
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-app);
}

.view-container {
  padding: 32px;
  flex: 1;
  overflow-y: auto;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* 头部通用 */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.view-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.view-header .subtitle {
  margin: 4px 0 0;
  color: var(--text-sub);
  font-size: 14px;
}

/* 通用组件类 */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.btn {
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: #000;
}

.btn-primary:hover {
  background: #3aa876;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-main);
}

.btn-text {
  background: transparent;
  padding: 4px 8px;
}

.btn-text:hover {
  background: rgba(255, 255, 255, 0.05);
}

.text-primary {
  color: var(--primary);
}

.text-danger {
  color: var(--danger);
}

.text-success {
  color: var(--success);
}

.text-sub {
  color: var(--text-sub);
}

/* 输入框 */
.search-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  width: 260px;
}

.search-box input {
  background: transparent;
  border: none;
  color: #fff;
  outline: none;
  margin-left: 8px;
  width: 100%;
  font-family: inherit;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.font-mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
</style>
