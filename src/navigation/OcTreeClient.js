/**
 * @fileOverview OcTreeClient - 用于显示ROS octomap_msgs/Octomap消息的客户端。
 */

import { EventEmitter } from "eventemitter3";
import ROSLIB from "roslib";
import { SceneNode } from "../visualization/SceneNode.js";
import { getLogger } from "../utils/Logger.js";
import { OcTree } from "./OcTree.js";
import { ColorOcTree } from "./ColorOcTree.js";

const logger = getLogger("OcTreeClient");

/**
 * @class OcTreeClient
 * @description 一个监听给定Octomap主题的客户端。
 * @extends EventEmitter
 */
export class OcTreeClient extends EventEmitter {
  /**
   * @param {object} options - 配置选项。
   * @param {ROSLIB.Ros} options.ros - ROSLIB.Ros的连接句柄。
   * @param {string} [options.topic='/octomap_full'] - 要监听的Octomap主题。
   * @param {boolean} [options.continuous=false] - 地图是否应连续加载。
   * @param {object} options.tfClient - 用于场景节点的TF客户端句柄。
   * @param {string} [options.compression='cbor'] - 消息压缩方式。
   * @param {THREE.Object3D} [options.rootObject] - 用于添加此地图的根对象。
   * @param {ROSLIB.Pose} [options.offsetPose] - 栅格可视化的偏移位姿。
   * @param {object} [options.color] - （用于非彩色八叉树）体素的颜色。
   * @param {number} [options.opacity=1.0] - 可视化栅格的不透明度。
   */
  constructor(options = {}) {
    super();
    this.ros = options.ros;
    this.topicName = options.topic || "/octomap_full";
    this.continuous = options.continuous || false;
    this.tfClient = options.tfClient;
    this.rootObject = options.rootObject || new THREE.Object3D();
    this.offsetPose = options.offsetPose || new ROSLIB.Pose();
    this.compression = options.compression || "cbor";
    this.octreeOptions = {
      color: options.color,
      opacity: options.opacity,
    };

    this.sceneNode = null;

    this.processMessage = this.processMessage.bind(this);
    if (this.ros) {
      this.subscribe();
    }
  }

  /**
   * @method dispose
   * @description 清理所有资源，取消订阅并移除地图。
   */
  dispose() {
    this.unsubscribe();
    if (this.sceneNode) {
      this.rootObject.remove(this.sceneNode);
      this.sceneNode.dispose();
      this.sceneNode = null;
    }
  }

  /**
   * @method unsubscribe
   * @description 取消订阅ROS主题。
   */
  unsubscribe() {
    if (this.rosTopic) {
      this.rosTopic.unsubscribe(this.processMessage);
      this.rosTopic = null;
    }
  }

  /**
   * @method subscribe
   * @description 订阅ROS主题。
   */
  subscribe() {
    this.unsubscribe();

    this.rosTopic = new ROSLIB.Topic({
      ros: this.ros,
      name: this.topicName,
      messageType: "octomap_msgs/Octomap",
      queue_length: 1,
      compression: this.compression,
    });
    this.rosTopic.subscribe(this.processMessage);
    logger.info(`Subscribed to OcTree topic: ${this.topicName}`);
  }

  /**
   * @private
   * @method processMessage
   * @description 处理接收到的地图消息。
   * @param {object} message - octomap_msgs/Octomap 消息。
   */
  processMessage(message) {
    if (this.sceneNode) {
      this.rootObject.remove(this.sceneNode);
      this.sceneNode.dispose();
      this.sceneNode = null;
    }

    const octreeOptions = { ...this.octreeOptions, message };
    let octreeObject;

    // 根据消息ID决定创建普通八叉树还是彩色八叉树
    if (message.id === 'ColorOcTree') {
      octreeObject = new ColorOcTree(octreeOptions);
    } else {
      octreeObject = new OcTree(octreeOptions);
    }

    this.sceneNode = new SceneNode({
      frameID: message.header.frame_id,
      tfClient: this.tfClient,
      object: octreeObject,
      pose: this.offsetPose,
    });
    this.rootObject.add(this.sceneNode);

    this.emit("change");

    if (!this.continuous) {
      this.unsubscribe();
    }
  }
}
