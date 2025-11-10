import * as ROSLIB from 'roslib';
import * as THREE from 'three';
import { InteractiveMarkerHandle } from './InteractiveMarkerHandle.js';
import { InteractiveMarker } from './InteractiveMarker.js';

/**
 * 交互式标记话题的客户端。
 *
 * @constructor
 * @param {object} options - 包含以下键的选项对象：
 * @param {ROSLIB.Ros} options.ros - ROS 的连接句柄。
 * @param {ROS3D.TfClient} options.tfClient - TF 客户端句柄。
 * @param {string} [options.topic] - 要订阅的话题，例如 '/basic_controls'，如果未提供，则使用 subscribe() 开始接收消息。
 * @param {string} [options.path] - 将要加载的任何网格的基础路径。
 * @param {THREE.Camera} options.camera - 与此标记客户端的查看器关联的主摄像机。
 * @param {THREE.Object3D} [options.rootObject] - 要渲染到的根 THREE 3D 对象。
 * @param {object} [options.loader] - 要使用的 Collada 加载器（例如 ROS3D.COLLADA_LOADER 的实例）。
 * @param {string} [options.menuFontSize] - 菜单字体大小。
 */
export class InteractiveMarkerClient {
  constructor(options) {
    options = options || {};
    this.ros = options.ros;
    this.tfClient = options.tfClient;
    this.topicName = options.topic;
    this.path = options.path || '/';
    this.camera = options.camera;
    this.rootObject = options.rootObject || new THREE.Object3D();
    this.loader = options.loader;
    this.menuFontSize = options.menuFontSize || '0.8em';

    this.interactiveMarkers = {};
    this.updateTopic = null;
    this.feedbackTopic = null;
    this.processUpdate = this.processUpdate.bind(this);

    // check for an initial topic
    if (this.topicName) {
      this.subscribe(this.topicName);
    }
  }

  /**
   * Subscribe to the given interactive marker topic. This will unsubscribe from any current topics.
   *
   * @param {string} topic - the topic to subscribe to, like '/basic_controls'
   */
  subscribe(topic) {
    // unsubscribe to the other topics
    this.unsubscribe();

    this.updateTopic = new ROSLIB.Topic({
      ros: this.ros,
      name: topic + '/tunneled/update',
      messageType: 'visualization_msgs/InteractiveMarkerUpdate',
      compression: 'png'
    });
    this.updateTopic.subscribe(this.processUpdate);

    this.feedbackTopic = new ROSLIB.Topic({
      ros: this.ros,
      name: topic + '/feedback',
      messageType: 'visualization_msgs/InteractiveMarkerFeedback',
      compression: 'png'
    });
    this.feedbackTopic.advertise();

    this.initService = new ROSLIB.Service({
      ros: this.ros,
      name: topic + '/tunneled/get_init',
      serviceType: 'demo_interactive_markers/GetInit'
    });
    const request = new ROSLIB.ServiceRequest({});
    this.initService.callService(request, this.processInit.bind(this));
  }

  /**
   * Unsubscribe from the current interactive marker topic.
   */
  unsubscribe() {
    if (this.updateTopic) {
      this.updateTopic.unsubscribe(this.processUpdate);
    }
    if (this.feedbackTopic) {
      this.feedbackTopic.unadvertise();
    }
    // erase all markers
    for (const intMarkerName in this.interactiveMarkers) {
      this.eraseIntMarker(intMarkerName);
    }
    this.interactiveMarkers = {};
  }

  /**
   * Process the given interactive marker initialization message.
   *
   * @param {object} initMessage - the interactive marker initialization message to process
   */
  processInit(initMessage) {
    const message = initMessage.msg;

    // erase any old markers
    message.erases = [];
    for (const intMarkerName in this.interactiveMarkers) {
      message.erases.push(intMarkerName);
    }
    message.poses = [];

    // treat it as an update
    this.processUpdate(message);
  }

  /**
   * Process the given interactive marker update message.
   *
   * @param {object} message - the interactive marker update message to process
   */
  processUpdate(message) {
    // erase any markers
    message.erases.forEach((name) => {
      this.eraseIntMarker(name);
    });

    // updates marker poses
    message.poses.forEach((poseMessage) => {
      const marker = this.interactiveMarkers[poseMessage.name];
      if (marker) {
        marker.setPoseFromServer(poseMessage.pose);
      }
    });

    // add new markers
    message.markers.forEach((msg) => {
      // get rid of anything with the same name
      const oldhandle = this.interactiveMarkers[msg.name];
      if (oldhandle) {
        this.eraseIntMarker(oldhandle.name);
      }

      // create the handle
      const handle = new InteractiveMarkerHandle({
        message: msg,
        feedbackTopic: this.feedbackTopic,
        tfClient: this.tfClient,
        menuFontSize: this.menuFontSize
      });
      this.interactiveMarkers[msg.name] = handle;

      // create the actual marker
      const intMarker = new InteractiveMarker({
        handle: handle,
        camera: this.camera,
        path: this.path,
        loader: this.loader
      });
      // add it to the scene
      intMarker.name = msg.name;
      this.rootObject.add(intMarker);

      // listen for any pose updates from the server
      handle.on('pose', (pose) => {
        intMarker.onServerSetPose({
          pose: pose
        });
      });

      // add bound versions of UI handlers
      intMarker.addEventListener('user-pose-change', handle.setPoseFromClient);
      intMarker.addEventListener('user-mousedown', handle.onMouseDown);
      intMarker.addEventListener('user-mouseup', handle.onMouseUp);
      intMarker.addEventListener('user-button-click', handle.onButtonClick);
      intMarker.addEventListener('menu-select', handle.onMenuSelect);

      // now listen for any TF changes
      handle.subscribeTf();
    });
  }

  /**
   * Erase the interactive marker with the given name.
   *
   * @param {string} intMarkerName - the interactive marker name to delete
   */
  eraseIntMarker(intMarkerName) {
    if (this.interactiveMarkers[intMarkerName]) {
      // remove the object
      const targetIntMarker = this.rootObject.getObjectByName(intMarkerName);
      this.rootObject.remove(targetIntMarker);
      // unsubscribe from TF topic!
      const handle = this.interactiveMarkers[intMarkerName];
      handle.unsubscribeTf();

      // remove all other listeners
      targetIntMarker.removeEventListener('user-pose-change', handle.setPoseFromClient);
      targetIntMarker.removeEventListener('user-mousedown', handle.onMouseDown);
      targetIntMarker.removeEventListener('user-mouseup', handle.onMouseUp);
      targetIntMarker.removeEventListener('user-button-click', handle.onButtonClick);
      targetIntMarker.removeEventListener('menu-select', handle.onMenuSelect);

      // remove the handle from the map - after leaving this function's scope, there should be no references to the handle
      delete this.interactiveMarkers[intMarkerName];
      targetIntMarker.dispose();
    }
  }
}