<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <h1>插件市场</h1>
        <p class="subtitle">连接至 OSS 仓库</p>
      </div>
      <div class="search-box">
        <span class="icon">🔍</span>
        <input type="text" placeholder="搜索插件 (e.g. Serial)..." />
      </div>
    </header>

    <div class="grid-layout">
      <div v-for="item in list" :key="item.id" class="plugin-card">
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
          <button class="btn btn-primary btn-sm" @click="$emit('download', item)">获取</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { MarketItem } from '../types'

export default defineComponent({
  name: 'MarketView',
  props: {
    list: {
      type: Array as PropType<MarketItem[]>,
      required: true
    }
  },
  emits: ['download']
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
</style>
