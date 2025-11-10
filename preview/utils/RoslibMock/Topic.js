/**
 * @fileOverview
 *
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
    
    // 存储本地订阅的回调函数
    this.subscribers = new Set();
    
    // 存储ROS连接上的消息回调处理器
    this.rosCallback = this._handleMessage.bind(this);
  }

  /**
   * 处理从ROS连接传来的消息
   */
  _handleMessage(message) {
    // 将消息分发给本地所有订阅者
    this.subscribers.forEach(callback => {
      setTimeout(() => callback(message), 0);
    });
  }

  /**
   * 订阅主题
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      // 添加到本地订阅者列表
      this.subscribers.add(callback);
      
      // 在真实的ROSLIB中，Topic会将消息回调注册到Ros连接上
      // 以监听该主题的事件
      if (this.ros) {
        // 确保只注册一次
        if (!this.isSubscribedToRos) {
          this.ros.on(this.name, this.rosCallback);
          this.isSubscribedToRos = true;
        }
      }
      
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
    
    // 如果没有更多本地订阅者，取消在ROS连接上的监听
    if (this.subscribers.size === 0 && this.ros && this.isSubscribedToRos) {
      this.ros.off(this.name, this.rosCallback);
      this.isSubscribedToRos = false;
    }
  }

  /**
   * 发布消息
   */
  publish(message) {
    console.log(`[MockTopic] 发布消息到主题: ${this.name}`, message);
    // 在真实ROSLIB中，Topic将消息发布到ROS连接
    if (this.ros) {
      this.ros.publishToTopic(this.name, message);
    }
  }
}