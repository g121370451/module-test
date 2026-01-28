<script setup lang="ts">
const connect = (): void => {console.log("cionnn");window.l136.send("connect-device")}
const disconnect = (): void => window.l136.send("stop-device")
</script>

<template>
  <h1>🔌 L136 控制台</h1>
    <div class="box">
        <button @click=connect>连接设备</button>
        <button @click=disconnect>断开连接</button>
    </div>
    <div class="box">
        <h3>实时遥测: <span id="voltage">---</span> V</h3>
        <div id="log"></div>
    </div>
</template>
