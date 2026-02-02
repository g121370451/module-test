<template>
  <div class="view-container">
    <header class="view-header">
      <h1>设备管理</h1>
    </header>

    <div class="table-card">
      <table class="modern-table">
        <thead>
          <tr>
            <th>状态</th>
            <th>设备 ID</th>
            <th>描述</th>
            <th>占用插件</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dev in list" :key="dev.id">
            <td>
              <span class="status-badge" :class="dev.status">{{ dev.status }}</span>
            </td>
            <td class="font-mono">{{ dev.id }}</td>
            <td>{{ dev.desc }}</td>
            <td>{{ dev.pluginId || '-' }}</td>
            <td><button class="btn btn-text">详情</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { DeviceItem } from '../types'

export default defineComponent({
  name: 'DevicesView',
  props: {
    list: { type: Array as PropType<DeviceItem[]>, required: true }
  }
})
</script>

<style scoped>
.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.modern-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.modern-table th {
  background: var(--surface-light);
  color: var(--text-sub);
  font-weight: normal;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.modern-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text-main);
}
.modern-table tr:last-child td {
  border-bottom: none;
}
.status-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}
.status-badge.online {
  background: rgba(66, 185, 131, 0.2);
  color: var(--success);
}
.status-badge.busy {
  background: rgba(230, 162, 60, 0.2);
  color: var(--warning);
}
</style>
