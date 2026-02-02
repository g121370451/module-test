<template>
  <div class="view-container">
    <header class="view-header">
      <div class="header-main">
        <h1>控制台概览</h1>
        <p class="subtitle">系统运行时间: 12h 30m</p>
      </div>
      <button class="btn btn-outline">系统设置</button>
    </header>

    <div class="dashboard-grid">
      <div class="card stat-card glow-green">
        <div class="stat-icon">⚡</div>
        <div class="stat-info">
          <div class="label">系统状态</div>
          <div class="value">运行正常</div>
        </div>
        <div class="chart-mini"></div>
      </div>

      <div class="card stat-card">
        <div class="stat-icon">🧩</div>
        <div class="stat-info">
          <div class="label">活跃插件</div>
          <div class="value">2 <span class="unit">个</span></div>
        </div>
      </div>

      <div class="card stat-card glow-orange">
        <div class="stat-icon">🔌</div>
        <div class="stat-info">
          <div class="label">串口占用</div>
          <div class="value">COM3</div>
        </div>
      </div>
    </div>

    <div class="card log-panel">
      <h3>最近活动</h3>
      <ul class="log-list">
        <li><span class="time">10:23:45</span> [System] 宿主启动完成</li>
        <li><span class="time">10:23:48</span> [Plugin] L136 插件加载成功 (v1.2.0)</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({ name: 'HomeView' })
</script>

<style scoped>
/* 局部样式，具体实现在全局 CSS 中复用 */
.glow-green {
  border-bottom: 2px solid var(--success);
}
.glow-orange {
  border-bottom: 2px solid var(--warning);
}
.log-panel {
  margin-top: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.log-list {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
  font-family: 'Consolas', monospace;
  font-size: 13px;
  color: #888;
}
.log-list li {
  padding: 4px 0;
  border-bottom: 1px solid #333;
}
.time {
  color: #569cd6;
  margin-right: 10px;
}
</style>
