<template>
  <div class="view-container">
    <header class="view-header">
      <h1>本地插件</h1>
      <button class="btn btn-outline btn-sm">刷新列表</button>
    </header>

    <div class="list-layout">
      <div v-for="group in list" :key="group.id" class="group-container">
        <div class="group-header">
          <span class="folder-icon">📂</span>
          <span class="group-name">{{ group.name }}</span>
          <span class="group-id">{{ group.id }}</span>
        </div>

        <div class="version-list">
          <div v-for="ver in group.versions" :key="ver.version" class="version-row">
            <div class="ver-info">
              <div class="ver-badges">
                <span class="ver-tag">v{{ ver.version }}</span>
                <span :class="['status-dot', ver.status]"></span>
                <span class="status-text">{{ ver.status.toUpperCase() }}</span>
              </div>
              <div class="ver-path">{{ ver.path }}</div>
            </div>
            
            <div class="ver-actions">
              <template v-if="ver.status === 'running'">
                <button class="btn btn-text text-primary" @click="$emit('ui', ver)">界面</button>
                <button class="btn btn-text text-danger" @click="$emit('stop', ver)">停止</button>
              </template>
              <template v-else>
                <button class="btn btn-text text-success" @click="$emit('run', ver)">启动</button>
                <button class="btn btn-text text-sub" @click="$emit('uninstall', ver)">卸载</button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="view-placeholder-tip">
      当插件界面打开时，将覆盖此区域
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { LocalPluginGroup } from '../types'

export default defineComponent({
  name: 'LocalView',
  props: {
    list: {
      type: Array as PropType<LocalPluginGroup[]>,
      required: true
    }
  },
  emits: ['run', 'stop', 'ui', 'uninstall']
})
</script>

<style scoped>
.group-container { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 16px; overflow: hidden; }
.group-header { background: var(--surface-light); padding: 10px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; }
.group-name { font-weight: 600; color: var(--text-main); }
.group-id { font-family: monospace; color: var(--text-sub); font-size: 12px; background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px; }
.version-row { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
.version-row:last-child { border-bottom: none; }
.ver-badges { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.ver-tag { font-weight: bold; color: var(--text-main); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status-dot.running { background: var(--success); box-shadow: 0 0 6px var(--success); }
.status-dot.stopped { background: #666; }
.status-text { font-size: 10px; font-weight: bold; color: var(--text-sub); }
.ver-path { font-size: 12px; font-family: monospace; color: #666; }
.view-placeholder-tip { margin-top: 20px; text-align: center; color: #444; font-size: 12px; border: 1px dashed #333; padding: 20px; border-radius: 8px; }
</style>