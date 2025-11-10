/**
 * @fileOverview
 *
 * 模拟ROSLIB.Ros类
 * 用于建立与ROS系统的连接
 */
export class Ros {
  constructor(options = {}) {
    this.url = options.url || 'ws://localhost:9090';
    this.id = options.id || 'mock_ros_connection';
    this.isConnected = false;
    this.eventHandlers = new Map(); // 存储事件处理器 (包括主题事件)
    this.services = new Map(); // 存储服务
    this.params = new Map(); // 存储参数
    
    // 模拟立即连接成功
    setTimeout(() => {
      this.isConnected = true;
      this._triggerEvent('connection');
    }, 0);
  }

  /**
   * 事件监听 - 支持通用事件和主题事件
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
    // 获取所有以/开头的事件处理器名称（这些通常是主题名称）
    const topicNames = Array.from(this.eventHandlers.keys()).filter(name => name.startsWith('/'));
    // 对于Mock，我们不提供类型，但可以扩展以支持
    const topicTypes = new Array(topicNames.length).fill('unknown');
    
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
  
  /**
   * 向特定主题发布消息（用于Mock环境内部通信）
   * 在真正的ROSLIB中，这是通过WebSocket接收并触发对应主题事件完成的
   */
  publishToTopic(topicName, message) {
    // 在真实ROSLIB中，Ros连接会触发以主题名称命名的事件
    // 这个机制模拟了rosbridge通过WebSocket发送消息到ROS连接的过程
    this._triggerEvent(topicName, message);
  }
}