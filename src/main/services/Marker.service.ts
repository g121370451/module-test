import { app, BrowserWindow } from "electron";
import path from "path";
import fs from 'fs-extra';
import axios from "axios";
import { pipeline } from 'stream/promises';
import AdmZip from "adm-zip";

export class MarketService {
    private tasks: Map<string, DownloadTask> = new Map();
    private mainWindow: BrowserWindow;
    private pluginsDir: string;
    private sharedLibsDir: string;
    private static instance: MarketService;

    public static getInstance(): MarketService {
        if (!this.instance) {
            this.instance = new MarketService()
        }
        return this.instance
    }
    private constructor() {
        const [mainWindow] = BrowserWindow.getAllWindows()
        this.mainWindow = mainWindow;
        // 设定插件安装目录: %AppData%/MyApp/plugins
        this.pluginsDir = path.join(app.getPath('userData'), 'plugins');
        // 设定公共依赖目录: %AppData%/MyApp/shared_libs
        this.sharedLibsDir = path.join(app.getPath('userData'), 'shared_libs');

        fs.ensureDirSync(this.pluginsDir);
        fs.ensureDirSync(this.sharedLibsDir);
    }
    private _notifyUpdate() {
        // 发送 'market:update' 事件
        this.mainWindow.webContents.send('market:update', this.getTasks());
    }

    /**
     * 处理公共依赖软链接
     * 例如：插件需要 ffmpeg，我们在它的 node_modules 下创建一个指向 shared_libs/ffmpeg 的软链
   */
    private async linkSharedDeps(pluginDir: string, deps: string[]) {
        if (!deps || deps.length === 0) return;

        const pluginNodeModules = path.join(pluginDir, 'node_modules');
        await fs.ensureDir(pluginNodeModules);

        for (const depName of deps) {
            // 假设 OSS 上下载的 shared lib 已经存在于本地 shared_libs 目录
            // 这里简化处理，直接链接最新的
            const srcLibPath = path.join(this.sharedLibsDir, depName);
            const destLibPath = path.join(pluginNodeModules, depName);

            if (fs.existsSync(srcLibPath)) {
                try {
                    // 创建 Junction (Windows 软链接)
                    await fs.ensureSymlink(srcLibPath, destLibPath, 'junction');
                    console.log(`[Link] Linked ${depName} for plugin.`);
                } catch (e) {
                    console.warn(`[Link] Failed to link ${depName}`, e);
                }
            } else {
                console.warn(`[Link] Shared lib ${depName} not found locally.`);
            }
        }
    }
    /**
       * 获取所有任务列表
       */
    public getTasks() {
        return Array.from(this.tasks.values());
    }

    /**
   * 开始下载并安装插件
   */
    public async install(pluginId: string, version: string, url: string, deps: string[]) {
        const taskId = `${pluginId}@${version}`;

        // 1. 初始化任务
        const task: DownloadTask = {
            id: pluginId,
            version,
            progress: 0,
            status: 'downloading'
        };
        this.tasks.set(taskId, task);
        this._notifyUpdate(); // 通知前端

        try {
            // 2. 准备临时文件路径
            const tmpZipPath = path.join(app.getPath('temp'), `${taskId}.zip`);
            const targetDir = path.join(this.pluginsDir, pluginId, version); // /plugins/l136/1.2.0

            // 3. 下载文件 (流式下载以支持进度)
            console.log(`[Installer] Start downloading ${url}`);
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream',
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        // 只有变化较大时才通知，避免IPC拥堵
                        if (percent > task.progress) {
                            task.progress = percent;
                            this._notifyUpdate();
                        }
                    }
                }
            });

            // 写入文件
            const writer = fs.createWriteStream(tmpZipPath);
            await pipeline(response.data, writer);

            // 4. 解压
            task.status = 'extracting';
            task.progress = 100;
            this._notifyUpdate();

            // 确保目标目录是空的
            await fs.emptyDir(targetDir);

            const zip = new AdmZip(tmpZipPath);
            // 解压到目标目录
            zip.extractAllTo(targetDir, true);

            // 清理临时文件
            await fs.remove(tmpZipPath);

            // 5. 处理依赖 (软链接 Shared Libs)
            await this.linkSharedDeps(targetDir, deps);

            // 6. 完成
            task.status = 'completed';
            this._notifyUpdate();
            console.log(`[Installer] ${pluginId} installed successfully.`);

        } catch (err: unknown) {
            console.error(`[Installer] Error:`, err);
            task.status = 'error';
            task.error = err instanceof Error ? err.message : 'Unknown error';
            this._notifyUpdate();
        }
    }
}