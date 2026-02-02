declare interface DownloadTask {
  id: string;
  version: string;
  progress: number;
  status: 'pending' | 'downloading' | 'extracting' | 'completed' | 'error';
  error?: string;
}

declare interface MarketItem {
  id: string;
  name: string;
  desc: string;
  version: string;
  url: string; // 插件 ZIP 下载地址
  deps: string[];
  // 前端辅助字段：当前的下载任务状态
  downloadState?: DownloadTask; 
}