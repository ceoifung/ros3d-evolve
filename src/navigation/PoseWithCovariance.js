import { Pose } from './Pose.js';

/**
 * 一个 PoseWithCovarianceStamped 客户端，监听给定话题并显示一个箭头。
 *
 * @constructor
 * @param {object} options
 * @param {ROSLIB.Ros} options.ros - ROSLIB.Ros 的连接句柄。
 * @param {string} options.topic - 要监听的话题。
 * @param {ROS3D.TfClient} options.tfClient - 要使用的 TF 客户端句柄。
 * @param {THREE.Object3D} options.rootObject - 要将此标记添加到的根对象。
 * @param {number} [options.color=0xcc00ff] - 箭头的颜色。
 * @param {number} [options.length] - 箭头的长度。
 */
export class PoseWithCovariance extends Pose {
  constructor(options) {
    // The messageType is the only difference from a standard Pose.
    const messageType = 'geometry_msgs/PoseWithCovarianceStamped';
    super({ ...options, messageType });
  }
}
