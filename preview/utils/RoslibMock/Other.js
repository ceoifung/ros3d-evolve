/**
 * @fileOverview
 *
 * 模拟ROSLIB.UrdfModel和Param类
 * 用于处理URDF模型和参数服务器
 */

/**
 * 模拟ROSLIB.UrdfModel类
 * 用于解析和表示URDF机器人模型
 */
export class UrdfModel {
  constructor(options = {}) {
    this.string = options.string || options.xml || '';
    this.domElement = null;
    
    // 解析XML字符串
    if (this.string) {
      this._parseUrdf();
    }
    
    // 初始化属性
    this.name = '';
    this.joints = {};
    this.links = {};
    this.materials = {};
  }

  /**
   * 解析URDF XML
   */
  _parseUrdf() {
    // 在浏览器环境中，我们使用DOMParser来解析XML
    if (typeof window !== 'undefined' && window.DOMParser) {
      try {
        const parser = new DOMParser();
        this.domElement = parser.parseFromString(this.string, 'text/xml');
        
        // 提取基本信息
        const robotElement = this.domElement.querySelector('robot');
        if (robotElement) {
          this.name = robotElement.getAttribute('name') || '';
        }
      } catch (e) {
        console.error('Error parsing URDF XML:', e);
      }
    }
  }
}

/**
 * 模拟ROSLIB.Param类
 * 用于访问和设置ROS参数服务器上的参数
 */
export class Param {
  constructor(options = {}) {
    this.ros = options.ros;
    this.name = options.name;
  }

  /**
   * 获取参数值
   */
  get(callback) {
    // 模拟参数服务器行为
    if (this.ros && this.ros.params) {
      const value = this.ros.params.get(this.name);
      setTimeout(() => callback(value), 0);
    } else {
      // 模拟默认参数值
      setTimeout(() => callback(null), 0);
    }
  }

  /**
   * 设置参数值
   */
  set(value, callback) {
    // 模拟设置参数
    if (this.ros && this.ros.params) {
      this.ros.params.set(this.name, value);
    }
    
    if (typeof callback === 'function') {
      setTimeout(callback, 0);
    }
  }

  /**
   * 删除参数
   */
  delete(callback) {
    // 模拟删除参数
    if (this.ros && this.ros.params) {
      this.ros.params.delete(this.name);
    }
    
    if (typeof callback === 'function') {
      setTimeout(callback, 0);
    }
  }
}