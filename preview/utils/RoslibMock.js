/**
 * @fileOverview
 *
 * ROSLIB Mock库 - 模拟真实的ROSLIB功能，用于在没有真实ROS环境的情况下进行测试
 * 实现了ROSLIB的主要类和接口，包括Ros、Topic、Service、TFClient、Pose、Transform、UrdfModel、Param
 */

/**
 * 模拟ROSLIB.Ros类
 * 用于建立与ROS系统的连接
 */
export class Ros {
  constructor(options = {}) {
    this.url = options.url || 'ws://localhost:9090';
    this.id = options.id || 'mock_ros_connection';
    this.isConnected = false;
    this.eventHandlers = new Map(); // 存储事件处理器
    this.topics = new Map(); // 存储主题
    this.services = new Map(); // 存储服务
    this.params = new Map(); // 存储参数
    
    // 模拟立即连接成功
    setTimeout(() => {
      this.isConnected = true;
      this._triggerEvent('connection');
    }, 0);
  }

  /**
   * 事件监听
   */
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }

  /**
   * 移除事件监听
   */
  off(event, callback) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(callback);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  _triggerEvent(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(callback => {
        setTimeout(() => callback(data), 0);
      });
    }
  }

  /**
   * 检查连接状态
   */
  isConnected() {
    return this.isConnected;
  }

  /**
   * 关闭连接
   */
  close() {
    this.isConnected = false;
    this._triggerEvent('close');
  }

  /**
   * 获取主题列表
   */
  getTopics(callback) {
    const topicNames = Array.from(this.topics.keys());
    const topicTypes = Array.from(this.topics.values()).map(t => t.type);
    
    setTimeout(() => {
      callback({
        topics: topicNames,
        types: topicTypes
      });
    }, 0);
  }

  /**
   * 获取服务列表
   */
  getServices(callback) {
    const serviceNames = Array.from(this.services.keys());
    
    setTimeout(() => {
      callback({
        services: serviceNames
      });
    }, 0);
  }

  /**
   * 调用服务
   */
  callOnConnection(callback) {
    if (typeof callback === 'function') {
      setTimeout(() => callback(), 0);
    }
  }
}

/**
 * 模拟ROSLIB.Topic类
 * 用于订阅和发布主题消息
 */
export class Topic {
  constructor(options) {
    this.ros = options.ros;
    this.name = options.name;
    this.messageType = options.messageType;
    this.compression = options.compression || 'none';
    this.throttle_rate = options.throttle_rate || null;
    this.queue_size = options.queue_size || 100;
    
    // 存储订阅的回调函数
    this.subscribers = new Set();
    
    // 在ROS连接中注册主题
    if (this.ros && this.ros.topics) {
      this.ros.topics.set(this.name, { type: this.messageType });
    }
  }

  /**
   * 订阅主题
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.add(callback);
      
      // 确保连接后再执行
      if (this.ros && typeof this.ros.callOnConnection === 'function') {
        this.ros.callOnConnection(() => {
          // 可能需要在这里执行其他初始化逻辑
        });
      }
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.delete(callback);
    }
  }

  /**
   * 发布消息
   */
  publish(message) {
    // 将消息发送给所有订阅者
    this.subscribers.forEach(callback => {
      setTimeout(() => callback(message), 0);
    });
  }
}

/**
 * 模拟ROSLIB.Service类
 * 用于调用ROS服务
 */
export class Service {
  constructor(options) {
    this.ros = options.ros;
    this.name = options.name;
    this.serviceType = options.serviceType;
    this.isAdvertised = false;
    this.serviceHandler = null;
    
    // 在ROS连接中注册服务
    if (this.ros && this.ros.services) {
      this.ros.services.set(this.name, this);
    }
  }

  /**
   * 调用服务
   */
  callService(request, callback, failedCallback) {
    // 模拟一个已知的服务响应
    if (this.name === '/tf2_web_republisher/get_frames') {
      const response = {
        frames: [
          { frame_id: 'map', parent_frame_id: null },
          { frame_id: 'odom', parent_frame_id: 'map' },
          { frame_id: 'base_link', parent_frame_id: 'odom' },
          { frame_id: 'laser_frame', parent_frame_id: 'base_link' },
          { frame_id: 'camera_depth_frame', parent_frame_id: 'base_link' },
        ]
      };
      setTimeout(() => callback(response), 0);
    } else {
      // 模拟服务不存在或返回默认响应
      setTimeout(() => {
        if (failedCallback) {
          failedCallback(new Error(`Service ${this.name} not available in mock`));
        } else {
          console.warn(`Service ${this.name} not implemented in mock`);
        }
      }, 0);
    }
  }

  /**
   * 广播服务（服务器端）
   */
  advertise(serviceCallback) {
    this.isAdvertised = true;
    this.serviceHandler = serviceCallback;
  }

  /**
   * 取消广播服务
   */
  unadvertise() {
    this.isAdvertised = false;
    this.serviceHandler = null;
  }
}

/**
 * 模拟ROSLIB.ServiceRequest类
 * 服务请求对象
 */
export class ServiceRequest {
  constructor(values) {
    Object.assign(this, values || {});
  }
}

/**
 * 模拟ROSLIB.TFClient类
 * 用于处理坐标变换
 */
export class TFClient {
  constructor(options = {}) {
    this.ros = options.ros;
    this.fixedFrame = options.fixedFrame || 'base_link';
    this.angularThres = options.angularThres || 0.01;
    this.transThres = options.transThres || 0.01;
    this.rate = options.rate || 10;
    this.updateDelay = options.updateDelay || 50;
    
    this.currentTransforms = new Map(); // 存储当前变换
    this.subscribeCallbacks = new Map(); // 存储订阅回调
    
    // 初始化一些默认变换
    this._initializeDefaultTransforms();
  }

  /**
   * 初始化默认变换
   */
  _initializeDefaultTransforms() {
    // 添加一些默认的变换
    this.currentTransforms.set('map', {
      frame_id: 'map',
      child_frame_id: 'odom',
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 }
    });
    
    this.currentTransforms.set('odom', {
      frame_id: 'odom',
      child_frame_id: 'base_link',
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 }
    });
  }

  /**
   * 订阅坐标变换
   */
  subscribe(frameId, callback) {
    if (typeof callback === 'function') {
      // 立即返回当前变换
      if (this.currentTransforms.has(frameId)) {
        setTimeout(() => callback(this.currentTransforms.get(frameId)), 0);
      }
      
      // 存储订阅回调
      if (!this.subscribeCallbacks.has(frameId)) {
        this.subscribeCallbacks.set(frameId, []);
      }
      this.subscribeCallbacks.get(frameId).push(callback);
    }
  }

  /**
   * 取消订阅坐标变换
   */
  unsubscribe(frameId, callback) {
    if (this.subscribeCallbacks.has(frameId)) {
      if (callback) {
        const callbacks = this.subscribeCallbacks.get(frameId);
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      } else {
        this.subscribeCallbacks.delete(frameId);
      }
    }
  }

  /**
   * 设置变换
   */
  setTransform(frameId, transform) {
    this.currentTransforms.set(frameId, transform);
    
    // 通知所有订阅者
    if (this.subscribeCallbacks.has(frameId)) {
      this.subscribeCallbacks.get(frameId).forEach(callback => {
        setTimeout(() => callback(transform), 0);
      });
    }
  }

  /**
   * 销毁TFClient
   */
  dispose() {
    this.subscribeCallbacks.clear();
    this.currentTransforms.clear();
  }
}

/**
 * 模拟ROSLIB.Pose类
 * 表示三维空间中的位置和方向
 */
export class Pose {
  constructor(options = {}) {
    this.position = options.position || { x: 0, y: 0, z: 0 };
    this.orientation = options.orientation || { x: 0, y: 0, z: 0, w: 1 };
  }

  /**
   * 克制姿态
   */
  clone() {
    return new Pose({
      position: { ...this.position },
      orientation: { ...this.orientation }
    });
  }

  /**
   * 应用变换
   */
  applyTransform(transform) {
    // 这里简化处理，仅作示例
    // 实际的变换计算会更复杂
    if (transform && transform.translation) {
      this.position.x += transform.translation.x;
      this.position.y += transform.translation.y;
      this.position.z += transform.translation.z;
    }
  }

  /**
   * 设置姿态
   */
  set(position, orientation) {
    this.position = position || this.position;
    this.orientation = orientation || this.orientation;
  }
}

/**
 * 模拟ROSLIB.Vector3类
 * 表示三维向量
 */
export class Vector3 {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.z = options.z || 0;
  }

  /**
   * 克制向量
   */
  clone() {
    return new Vector3({ x: this.x, y: this.y, z: this.z });
  }

  /**
   * 设置向量值
   */
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  /**
   * 向量加法
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  /**
   * 向量减法
   */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  /**
   * 向量长度
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
}

/**
 * 模拟ROSLIB.Quaternion类
 * 表示四元数
 */
export class Quaternion {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.z = options.z || 0;
    this.w = options.w || 1;
  }

  /**
   * 克制四元数
   */
  clone() {
    return new Quaternion({ x: this.x, y: this.y, z: this.z, w: this.w });
  }

  /**
   * 设置四元数值
   */
  set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /**
   * 四元数乘法
   */
  multiply(q) {
    const x = this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y;
    const y = this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x;
    const z = this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w;
    const w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;

    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    return this;
  }

  /**
   * 四元数归一化
   */
  normalize() {
    const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    if (len === 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      this.x /= len;
      this.y /= len;
      this.z /= len;
      this.w /= len;
    }
    return this;
  }
}

/**
 * 模拟ROSLIB.Transform类
 * 表示坐标变换
 */
export class Transform {
  constructor(options = {}) {
    this.translation = options.translation || new Vector3();
    this.rotation = options.rotation || new Quaternion();
  }

  /**
   * 克制变换
   */
  clone() {
    return new Transform({
      translation: this.translation.clone(),
      rotation: this.rotation.clone()
    });
  }

  /**
   * 获取逆变换
   */
  inverse() {
    const invRotation = this.rotation.clone();
    invRotation.x = -invRotation.x;
    invRotation.y = -invRotation.y;
    invRotation.z = -invRotation.z;
    
    // 简化的逆变换计算
    const invTranslation = this.translation.clone();
    invTranslation.multiplyScalar(-1);
    
    return new Transform({
      translation: invTranslation,
      rotation: invRotation
    });
  }

  /**
   * 设置变换
   */
  set(translation, rotation) {
    this.translation = translation || this.translation;
    this.rotation = rotation || this.rotation;
  }
}

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

/**
 * 模拟ROSLIB.Message类
 * 通用消息类
 */
export class Message {
  constructor(values) {
    Object.assign(this, values || {});
  }
}

/**
 * 模拟ROSLIB.ActionClient类
 * 用于处理ROS动作
 */
export class ActionClient {
  constructor(options = {}) {
    this.ros = options.ros;
    this.serverName = options.serverName;
    this.actionName = options.actionName;
    this.timeout = options.timeout;
    
    this.goals = new Map(); // 存储目标
  }

  /**
   * 发送目标
   */
  sendGoal(goal, feedbackCallback, resultCallback) {
    // 模拟动作客户端行为
    const goalId = 'goal_' + Date.now();
    
    // 模拟立即完成动作
    setTimeout(() => {
      if (typeof resultCallback === 'function') {
        resultCallback({ status: 'succeeded', result: {} });
      }
    }, 100);
    
    return { 
      id: goalId,
      cancel: () => {} // 取消函数
    };
  }
}