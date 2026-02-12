declare interface FrameData {
    success: boolean;
    data?: Buffer;
    width?: number;
    height?: number;
    timestamp?: number;
}
declare interface MediaInfo {
    valid: boolean;
    type: string;
    duration: number;
    width: number;
    height: number;
    sar: string;
    dar: string;
}
declare interface IMediaManagerClass {
    getInstance(): MediaManager;
}
export interface IFFmpegModule {
    MediaManager: IMediaManagerClass;
}
export declare class MediaManager {
    private static instance;
    static getInstance(): MediaManager;
    private _instance;
    private constructor();
    addMedia(devId: string, index: number, url: string, x: number, y: number, sw: number, sh: number, ow: number, oh: number): boolean;
    getMediaInfo(filePath: string): MediaInfo;
    deleteMedia(devId: string, index: number): boolean;
    updateROI(devId: string, index: number, x: number, y: number, sw: number, sh: number): void;
    pause(devId: string, index: number): boolean;
    resume(devId: string, index: number): boolean;
    getNextFrame(devId: string, index: number): FrameData;
}
export {};
