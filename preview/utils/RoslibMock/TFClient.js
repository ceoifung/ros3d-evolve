/**
 * @fileOverview
 *
 * 模拟ROSLIB.TFClient类
 * 用于处理坐标变换
 */
export class TFClient {
  constructor(options = {}) {
    this.ros = options.ros;
    this.fixedFrame = options.fixedFrame || 'map';
    this.angularThres = options.angularThres || 0.01;
    this.transThres = options.transThres || 0.01;
    this.rate = options.rate || 10;
    this.updateDelay = options.updateDelay || 50;
    
    this.currentTransforms = new Map(); // 存储当前变换
    this.frameCallbacks = new Map(); // 存储特定frame的回调
    
    // 初始化一些默认变换
    this._initializeDefaultTransforms();
  }

  /**
   * 初始化默认变换
   */
  _initializeDefaultTransforms() {
    // 不再初始化内部存储的变换，而是直接返回标准格式的变换
  }

  /**
   * 订阅坐标变换
   */
  subscribe(frameId, callback) {
    if (typeof callback === 'function') {
      // 存储订阅回调
      if (!this.frameCallbacks.has(frameId)) {
        this.frameCallbacks.set(frameId, []);
      }
      this.frameCallbacks.get(frameId).push(callback);
      
      // 立即发送一个默认变换，防止SceneNode在等待TF时出现问题
      setTimeout(() => {
        const defaultTransform = {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 }
        };
        callback(defaultTransform);
      }, 0);
    }
  }

  /**
   * 取消订阅坐标变换
   */
  unsubscribe(frameId, callback) {
    if (this.frameCallbacks.has(frameId)) {
      if (callback) {
        const callbacks = this.frameCallbacks.get(frameId);
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      } else {
        this.frameCallbacks.delete(frameId);
      }
    }
  }

  /**
   * 销毁TFClient
   */
  dispose() {
    this.frameCallbacks.clear();
  }
}