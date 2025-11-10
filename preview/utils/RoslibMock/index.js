/**
 * @fileOverview
 *
 * ROSLIB Mock库统一入口
 * 提供与真实ROSLIB完全兼容的API接口
 */

// 导入所有ROSLIB模拟类
import { Ros } from './Ros.js';
import { Topic } from './Topic.js';
import { Service, ServiceRequest } from './Service.js';
import { TFClient } from './TFClient.js';
import { Pose, Vector3, Quaternion, Transform } from './Math.js';
import { UrdfModel, Param } from './Other.js';

// 消息推送器类，用于将数据推送到Mock ROS连接
class MessagePusher {
  constructor(ros) {
    this.ros = ros;
  }

  /**
   * 直接向特定主题推送消息
   * @param {string} topicName - 主题名称
   * @param {Object} message - 要推送的消息
   */
  pushMessage(topicName, message) {
    // 直接通过ROS连接发布，这样可以确保消息路由到正确的订阅者
    // 这种方式模拟了ROS Bridge将消息发送到WebSocket，然后ROS连接触发主题事件的过程
    if (this.ros) {
      this.ros.publishToTopic(topicName, message);
    }
  }

  /**
   * 按频率推送消息
   * @param {string} topicName - 主题名称
   * @param {Function} messageGenerator - 消息生成函数
   * @param {number} frequency - 频率（Hz）
   * @returns {Object} 包含stop方法的对象，用于停止推送
   */
  pushMessageAtFrequency(topicName, messageGenerator, frequency) {
    const interval = 1000 / frequency;
    let running = true;
    console.log(`[MessagePusher] 开始以 ${frequency}Hz (${interval}ms间隔) 推送消息到主题: ${topicName}`);
    
    const pusher = setInterval(() => {
      if (!running) {
        console.log('[MessagePusher] 推送停止');
        clearInterval(pusher);
        return;
      }
      const message = messageGenerator();
      this.pushMessage(topicName, message);
    }, interval);
    
    return {
      stop: () => {
        console.log('[MessagePusher] 停止推送');
        running = false;
      }
    };
  }

  /**
   * 批量推送消息
   * @param {Array} messages - 消息数组，每个元素包含{topic, message}
   */
  pushMessages(messages) {
    messages.forEach(({ topic, message }) => {
      this.pushMessage(topic, message);
    });
  }
}

// 扩展Ros类以支持直接消息推送
export class MockRos extends Ros {
  constructor(options = {}) {
    super(options);
    this.messagePusher = new MessagePusher(this);
    
    // 初始化一些常见服务
    this._initializeDefaultServices();
  }

  /**
   * 获取消息推送器
   */
  getMessagePusher() {
    return this.messagePusher;
  }
  
  /**
   * 初始化默认服务
   */
  _initializeDefaultServices() {
    // 创建一个TF服务模拟，用于处理/tf和/tf_static请求
    const tfService = new Service({
      ros: this,
      name: '/tf2_web_republisher/get_frames',
      serviceType: 'tf2_web_republisher/GetFrames'
    });
    
    // 这里可以添加更多默认服务
    this.services.set('/tf2_web_republisher/get_frames', tfService);
  }
}

// 重新导出所有类
export { 
  MockRos as Ros, 
  Topic, 
  Service, 
  ServiceRequest, 
  TFClient, 
  Pose, 
  Vector3, 
  Quaternion, 
  Transform, 
  UrdfModel, 
  Param,
  MessagePusher 
};

// 创建一个默认导出，模拟整个ROSLIB模块
export default {
  Ros: MockRos,
  Topic,
  Service,
  ServiceRequest,
  TFClient,
  Pose,
  Vector3,
  Quaternion,
  Transform,
  UrdfModel,
  Param,
  MessagePusher,
  // 添加一个Message类，一些代码中可能会用到
  Message: class {
    constructor(values) {
      Object.assign(this, values || {});
    }
  },
  // 添加一个ActionClient类
  ActionClient: class {
    constructor(options = {}) {
      this.ros = options.ros;
      this.serverName = options.serverName;
      this.actionName = options.actionName;
      this.timeout = options.timeout;
      
      this.goals = new Map();
    }

    sendGoal(goal, feedbackCallback, resultCallback) {
      const goalId = 'goal_' + Date.now();
      
      // 模拟立即完成动作
      setTimeout(() => {
        if (typeof resultCallback === 'function') {
          resultCallback({ status: 'succeeded', result: {} });
        }
      }, 100);
      
      return { 
        id: goalId,
        cancel: () => {}
      };
    }
  }
};