/**
 * @fileOverview
 *
 * 模拟ROSLIB.Service类和ServiceRequest类
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