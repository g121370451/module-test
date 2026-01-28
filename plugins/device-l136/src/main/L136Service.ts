// 模拟硬件操作
export class L136Service {
    private port;
    private timer;
    constructor(port) {
        this.port = port;
        this.timer = null;
        this.init();
    }

    init() {
        // 监听来自前端 (View) 的消息
        this.port.on('message', (event) => {
            const { channel, data } = event.data;
            this.handleRequest(channel, data);
        });

        // 必须调用 start (Node MessagePort 标准)
        this.port.start();
        console.log('[L136 Service] 端口已连接，业务就绪');
    }

    handleRequest(channel, data) {
        console.log(`[L136 Service] 收到指令: ${channel}`, data);

        switch (channel) {
            case 'connect-device':
                // 模拟连接硬件
                this.port.postMessage({ channel: 'status', data: 'Connected: COM3' });
                this.startDataStream();
                break;
            case 'stop-device':
                this.stopDataStream();
                this.port.postMessage({ channel: 'status', data: 'Disconnected' });
                break;
        }
    }

    startDataStream() {
        if (this.timer) return;
        this.timer = setInterval(() => {
            // 模拟硬件推流
            const mockVoltage = (220 + Math.random() * 5).toFixed(2);
            this.port.postMessage({ channel: 'telemetry', data: { voltage: mockVoltage } });
        }, 1000);
    }

    stopDataStream() {
        clearInterval(this.timer);
        this.timer = null;
    }
}