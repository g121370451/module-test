<template>
  <div class="host-layout">
    <aside class="sidebar">
      <h2>Host App</h2>
      <nav>
        <button 
          :class="{ active: currentTab === 'L136' }" 
          @click="currentTab = 'L136'"
        >
          设备 L136
        </button>
        <button 
          :class="{ active: currentTab === 'L086' }" 
          @click="currentTab = 'L086'"
        >
          设备 L086
        </button>
      </nav>
    </aside>

    <main class="content-area">
      <PluginContainer 
        v-show="currentTab === 'L136'"
        :active="currentTab === 'L136'"
        plugin-path="E:\\project\\deepcool\\nodejs\\module-test\\plugins\\device-l136\\out" 
      />
      
      <PluginContainer 
        v-show="currentTab === 'L086'"
        :active="currentTab === 'L086'"
        plugin-path="E:\\project\\deepcool\\nodejs\\module-test\\plugins\\device-l136\\out" 
      />
      
      <div v-if="!currentTab" class="empty-state">请选择设备</div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PluginContainer from './components/PluginContainer.vue';

const currentTab = ref('');
</script>

<style>
html, body, #app { height: 100%; margin: 0; }
.host-layout { display: flex; height: 100vh; }
.sidebar { width: 250px; background: #2b2b2b; color: #fff; padding: 20px; }
.content-area {
  flex: 1;
  display: flex;       /* 关键 */
  flex-direction: column; /* 关键 */
  height: 100%;        /* 关键 */
  overflow: hidden;    /* 防止滚动条影响计算 */
}
.active { background: #42b983; color: #000; }
</style>