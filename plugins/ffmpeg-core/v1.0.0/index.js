"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaManager = void 0;
const nativeAddon = require('./module-ffmplayer-core.node');
class MediaManager {
    static getInstance() {
        if (!MediaManager.instance) {
            MediaManager.instance = new MediaManager();
        }
        return MediaManager.instance;
    }
    constructor() {
        this._instance = new nativeAddon.MediaManager();
    }
    addMedia(devId, index, url, x, y, sw, sh, ow, oh) {
        return this._instance.addMedia(devId, index, url, x, y, sw, sh, ow, oh);
    }
    getMediaInfo(filePath) {
        return nativeAddon.getMediaInfo(filePath);
    }
    deleteMedia(devId, index) {
        return this._instance.deleteMedia(devId, index);
    }
    updateROI(devId, index, x, y, sw, sh) {
        this._instance.updateROI(devId, index, x, y, sw, sh);
    }
    pause(devId, index) {
        return this._instance.pause(devId, index);
    }
    resume(devId, index) {
        return this._instance.resume(devId, index);
    }
    getNextFrame(devId, index) {
        return this._instance.getNextFrame(devId, index);
    }
}
exports.MediaManager = MediaManager;
