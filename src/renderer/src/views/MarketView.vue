<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <h1>插件市场</h1>
        <button class="btn btn-text" @click="fetchMarketList" :disabled="loading">
          {{ loading ? '加载中...' : '刷新' }}
        </button>
      </div>
      </header>

    <div v-if="loading && marketList.length === 0" class="loading-state">
      加载中...
    </div>

    <div v-else class="grid-layout">
      <div v-for="item in marketList" :key="item.id" class="plugin-card">
        <div class="card-top">
          <div class="plugin-icon">{{ item.name[0].toUpperCase() }}</div>
          <div class="plugin-meta">
            <h3>{{ item.name }}</h3>
            <span class="badge">v{{ item.version }}</span>
          </div>
        </div>
        
        <p class="plugin-desc">{{ item.desc }}</p>
        
        <div class="card-actions">
          <div class="deps">依赖: {{ item.deps.join(', ') }}</div>
          
          <div class="action-btn-area">
            <button 
              v-if="!item.downloadState" 
              class="btn btn-primary btn-sm" 
              @click="handleDownload(item)"
            >
              获取
            </button>

            <div v-else-if="isLoadingState(item.downloadState)" class="progress-box">
              <div class="progress-info">
                <span>{{ getStatusText(item.downloadState.status) }}</span>
                <span>{{ item.downloadState.progress }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: item.downloadState.progress + '%' }"></div>
              </div>
            </div>

            <button 
              v-else-if="item.downloadState.status === 'completed'" 
              class="btn btn-outline btn-sm" 
              disabled
            >
              已安装
            </button>
            
            <button 
              v-else-if="item.downloadState.status === 'error'" 
              class="btn btn-danger btn-sm" 
              @click="handleDownload(item)"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Market } from '../stores/market'
export default defineComponent({
  name: 'MarketView',
  setup() {
    // 直接解构 Hook 中的数据
    const { marketList, loading, fetchMarketList, handleDownload } = Market()

    // UI 纯辅助函数 (不需要放入 Hook，因为只跟显示文案有关)
    const isLoadingState = (task: DownloadTask) => {
      return task.status === 'downloading' || task.status === 'extracting' || task.status === 'pending'
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case 'pending': return '准备中'
        case 'downloading': return '下载中'
        case 'extracting': return '安装中'
        default: return '处理中'
      }
    }

    return {
      marketList,
      loading,
      fetchMarketList,
      handleDownload,
      isLoadingState,
      getStatusText
    }
  }
})
</script>

<style scoped>
.grid-layout {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

.plugin-card {
    background: var(--surface-light);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    transition:
        transform 0.2s,
        box-shadow 0.2s;
    display: flex;
    flex-direction: column;
}

.plugin-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-color: var(--primary);
}

.card-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.plugin-icon {
    width: 40px;
    height: 40px;
    background: #333;
    color: #fff;
    border-radius: 6px;
    display: grid;
    place-items: center;
    font-weight: bold;
}

.plugin-meta h3 {
    margin: 0;
    font-size: 16px;
    color: var(--text-main);
}

.plugin-desc {
    color: var(--text-sub);
    font-size: 13px;
    line-height: 1.5;
    flex: 1;
    margin-bottom: 16px;
}

.card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
}

.deps {
    font-size: 12px;
    color: #666;
}

.action-btn-area { min-width: 100px; text-align: right; }

.progress-box { width: 120px; }
.progress-info { display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-bottom: 4px; }
.progress-bar { height: 4px; background: #333; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--primary); transition: width 0.2s ease; }
</style>
