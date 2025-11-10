import * as ROSLIB from 'roslib';
import EventEmitter3 from 'eventemitter3';
import { FEEDBACK_POSE_UPDATE, FEEDBACK_BUTTON_CLICK, FEEDBACK_MOUSE_DOWN, FEEDBACK_MOUSE_UP, FEEDBACK_MENU_SELECT } from '../constants/interactiveMarker.constants.js';

/**
 * 单个交互式标记的句柄，包含其信号。
 *
 * 发出以下事件:
 *
 *  * 'pose' - 当从服务器收到新位姿时发出。
 *
 * @constructor
 * @param {object} options - 包含以下键的选项对象：
 * @param {object} options.message - 交互式标记消息。
 * @param {ROSLIB.Topic} options.feedbackTopic - 与反馈关联的 ROSLIB.Topic。
 * @param {ROS3D.TfClient} options.tfClient - 要使用的 TF 客户端句柄。
 * @param {string} [options.menuFontSize] - 菜单字体大小。
 */
export class InteractiveMarkerHandle extends EventEmitter3 {
  constructor(options) {
    super();
    options = options || {};
    this.message = options.message;
    this.feedbackTopic = options.feedbackTopic;
    this.tfClient = options.tfClient;
    this.menuFontSize = options.menuFontSize || '0.8em';
    this.name = this.message.name;
    this.header = this.message.header;
    this.controls = this.message.controls;
    this.menuEntries = this.message.menu_entries;
    this.dragging = false;
    this.timeoutHandle = null;
    this.tfTransform = new ROSLIB.Transform();
    this.pose = new ROSLIB.Pose();

    this.setPoseFromClient = this.setPoseFromClient.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onButtonClick = this.onButtonClick.bind(this);
    this.onMenuSelect = this.onMenuSelect.bind(this);

    // start by setting the pose
    this.setPoseFromServer(this.message.pose);
    this.tfUpdate = this.tfUpdate.bind(this);
  }

  /**
   * Subscribe to the TF associated with this interactive marker.
   */
  subscribeTf() {
    // subscribe to tf updates if frame-fixed
    if (this.message.header.stamp.secs === 0.0 && this.message.header.stamp.nsecs === 0.0) {
      this.tfClient.subscribe(this.message.header.frame_id, this.tfUpdate);
    }
  }

  unsubscribeTf() {
    this.tfClient.unsubscribe(this.message.header.frame_id, this.tfUpdate);
  }

  /**
   * Emit the new pose that has come from the server.
   */
  emitServerPoseUpdate() {
    const poseTransformed = new ROSLIB.Pose(this.pose);
    poseTransformed.applyTransform(this.tfTransform);
    this.emit('pose', poseTransformed);
  }

  /**
   * Update the pose based on the pose given by the server.
   *
   * @param {ROSLIB.Pose} poseMsg - the pose given by the server
   */
  setPoseFromServer(poseMsg) {
    this.pose = new ROSLIB.Pose(poseMsg);
    this.emitServerPoseUpdate();
  }

  /**
   * Update the pose based on the TF given by the server.
   *
   * @param {ROSLIB.Transform} transformMsg - the TF given by the server
   */
  tfUpdate(transformMsg) {
    this.tfTransform = new ROSLIB.Transform(transformMsg);
    this.emitServerPoseUpdate();
  }

  /**
   * Set the pose from the client based on the given event.
   *
   * @param {object} event - the event to base the change off of
   */
  setPoseFromClient(event) {
    // apply the transform
    this.pose = new ROSLIB.Pose(event);
    const inv = this.tfTransform.clone();
    inv.rotation.invert();
    inv.translation.multiplyQuaternion(inv.rotation);
    inv.translation.x *= -1;
    inv.translation.y *= -1;
    inv.translation.z *= -1;
    this.pose.applyTransform(inv);

    // send feedback to the server
    this.sendFeedback(INTERACTIVE_MARKER_POSE_UPDATE, undefined, 0, event.controlName);

    // keep sending pose feedback until the mouse goes up
    if (this.dragging) {
      if (this.timeoutHandle) {
        clearTimeout(this.timeoutHandle);
      }
      this.timeoutHandle = setTimeout(this.setPoseFromClient.bind(this, event), 250);
    }
  }

  /**
   * Send the button click feedback to the server.
   *
   * @param {object} event - the event associated with the button click
   */
  onButtonClick(event) {
    this.sendFeedback(INTERACTIVE_MARKER_BUTTON_CLICK, event.clickPosition, 0,
      event.controlName);
  }

  /**
   * Send the mousedown feedback to the server.
   *
   * @param {object} event - the event associated with the mousedown
   */
  onMouseDown(event) {
    this.sendFeedback(INTERACTIVE_MARKER_MOUSE_DOWN, event.clickPosition, 0, event.controlName);
    this.dragging = true;
  }

  /**
   * Send the mouseup feedback to the server.
   *
   * @param {object} event - the event associated with the mouseup
   */
  onMouseUp(event) {
    this.sendFeedback(INTERACTIVE_MARKER_MOUSE_UP, event.clickPosition, 0, event.controlName);
    this.dragging = false;
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }
  }

  /**
   * Send the menu select feedback to the server.
   *
   * @param {object} event - the event associated with the menu select
   */
  onMenuSelect(event) {
    this.sendFeedback(INTERACTIVE_MARKER_MENU_SELECT, undefined, event.id, event.controlName);
  }

  /**
   * Send feedback to the interactive marker server.
   *
   * @param {number} eventType - the type of event that happened
   * @param {object} [clickPosition] - the position in ROS space the click happened
   * @param {number} [menuEntryID] - the menu entry ID that is associated
   * @param {string} controlName - the name of the control
   */
  sendFeedback(eventType, clickPosition,
               menuEntryID, controlName) {

    // check for the click position
    const mousePointValid = clickPosition !== undefined;
    clickPosition = clickPosition || {
      x: 0,
      y: 0,
      z: 0
    };

    const feedback = {
      header: this.header,
      client_id: this.clientID,
      marker_name: this.name,
      control_name: controlName,
      event_type: eventType,
      pose: this.pose,
      mouse_point: clickPosition,
      mouse_point_valid: mousePointValid,
      menu_entry_id: menuEntryID
    };
    this.feedbackTopic.publish(feedback);
  }
}
