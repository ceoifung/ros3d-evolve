import * as THREE from 'three';
import * as ROSLIB from 'roslib';
import { SceneNode } from '../visualization/SceneNode.js';

/**
 * @constructor
 * @param {object} options
 * @param {ROSLIB.Ros} options.ros - ROSLIB.Ros 的连接句柄。
 * @param {string} options.topic - 要监听的话题，例如 '/point'。
 * @param {ROS3D.TfClient} options.tfClient - 要使用的 TF 客户端句柄。
 * @param {THREE.Object3D} options.rootObject - 要将此标记添加到的根对象。
 * @param {number} [options.color=0xcc00ff] - 点的颜色。
 * @param {number} [options.radius=0.2] - 点的半径。
 */
export class Point extends SceneNode {
  constructor(options) {
    super(options);
    this.options = options || {};
    this.ros = options.ros;
    this.topicName = options.topic || '/point';
    this.color = options.color || 0xcc00ff;
    this.radius = options.radius || 0.2;

    const sphereGeometry = new THREE.SphereGeometry(this.radius, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: this.color });
    this.object = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.add(this.object);

    this.rosTopic = undefined;
    this.processMessage = this.processMessage.bind(this);
    this.subscribe();
  }

  unsubscribe() {
    if (this.rosTopic) {
      this.rosTopic.unsubscribe(this.processMessage);
    }
  }

  subscribe() {
    this.unsubscribe();

    // subscribe to the topic
    this.rosTopic = new ROSLIB.Topic({
      ros: this.ros,
      name: this.topicName,
      queue_length: 1,
      messageType: 'geometry_msgs/PointStamped',
    });
    this.rosTopic.subscribe(this.processMessage);
  }

  processMessage(message) {
    this.updateFrame(message.header.frame_id);
    this.position.set(message.point.x, message.point.y, message.point.z);
  }

  dispose() {
    this.unsubscribe();
    this.object.geometry.dispose();
    this.object.material.dispose();
  }
}
