import * as THREE from "three";
import { Arrow } from "@models/Arrow";
import { TriangleList } from "@models/TriangleList";
import { MeshResource } from "@models/MeshResource";
import { makeColorMaterial, createMarkerObject } from "./marker.creators";
import {
  MARKER_ARROW,
  MARKER_CUBE,
  MARKER_SPHERE,
  MARKER_CYLINDER,
  MARKER_LINE_STRIP,
  MARKER_LINE_LIST,
  MARKER_CUBE_LIST,
  MARKER_SPHERE_LIST,
  MARKER_POINTS,
  MARKER_TEXT_VIEW_FACING,
  MARKER_MESH_RESOURCE,
  MARKER_TRIANGLE_LIST,
} from "../constants/marker.constants.js";
/**
 * Marker 类，可以将 ROS 标记消息转换为 THREE 对象。
 */
export class Marker extends THREE.Object3D {
  /**
   * @param {Object} options - 对象，包含以下键:
   *   * path - 为此标记加载的网格文件的基路径或 URL
   *   * message - 标记消息
   */
  constructor(options = {}) {
    super();

    this.path = options.path || '/';
    const { message } = options;

    // 检查路径尾部是否有 '/'
    this.normalizedPath =
      this.path.endsWith('/') ? this.path : `${this.path}/`;

    this.message = message;
    this.msgScale = message.scale ? [message.scale.x, message.scale.y, message.scale.z] : [1, 1, 1];
    this.msgColor = message.color;
    this.msgMesh = undefined;

    this.init(message);
  }

  /**
   * 使用消息初始化标记
   * @param {Object} message - 标记消息
   */
  init(message) {
    this.setPose(message.pose);
    if (message.type === MARKER_MESH_RESOURCE && message.mesh_resource) {
      this.msgMesh = message.mesh_resource.startsWith('package://')
        ? message.mesh_resource.substring(10)
        : message.mesh_resource;
    }

    const colorMaterial = makeColorMaterial(
      this.msgColor.r,
      this.msgColor.g,
      this.msgColor.b,
      this.msgColor.a,
    );

    const markerObject = createMarkerObject(message, this.normalizedPath, colorMaterial);
    if (markerObject) {
      this.add(markerObject);
    }
  }

  /**
   * 设置此标记的位姿为给定值
   * @param {Object} pose - 要设置的位姿
   */
  setPose(pose) {
    this.position.set(pose.position.x, pose.position.y, pose.position.z);
    this.quaternion.set(
      pose.orientation.x,
      pose.orientation.y,
      pose.orientation.z,
      pose.orientation.w,
    );
    this.quaternion.normalize();
    this.updateMatrixWorld();
  }

  /**
   * 更新此标记
   * @param {Object} message - 标记消息
   * @return {boolean} 成功时返回 true，否则返回 false
   */
  update(message) {
    // 检查类型是否改变，如果改变则无法更新
    if (message.type !== this.message.type) {
      return false;
    }
    this.message = message;

    // 始终更新位姿
    this.setPose(message.pose);

    const child = this.children[0];
    if (!child) {
      return false;
    }

    // 更新颜色
    if (
      message.color.r !== this.msgColor.r ||
      message.color.g !== this.msgColor.g ||
      message.color.b !== this.msgColor.b ||
      message.color.a !== this.msgColor.a
    ) {
      this.msgColor = message.color;
      const newMaterial = makeColorMaterial(
        this.msgColor.r,
        this.msgColor.g,
        this.msgColor.b,
        this.msgColor.a,
      );

      // 特殊处理网格资源
      if (message.type === MARKER_MESH_RESOURCE) {
        if (this.msgColor.a === 0) {
          child.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, color: 0x000000 });
        } else {
          child.material = newMaterial;
        }
      } else if (child.material) {
        child.material.dispose();
        child.material = newMaterial;
      }
    }

    // 更新尺寸
    const scaleChanged =
      Math.abs(this.msgScale[0] - message.scale.x) > 1e-6 ||
      Math.abs(this.msgScale[1] - message.scale.y) > 1e-6 ||
      Math.abs(this.msgScale[2] - message.scale.z) > 1e-6;

    if (scaleChanged) {
      this.msgScale = [message.scale.x, message.scale.y, message.scale.z];
      switch (message.type) {
        case MARKER_ARROW:
          // Arrow 的尺寸更新较为复杂，最好重建
          return false;
        case MARKER_CUBE:
        case MARKER_SPHERE:
        case MARKER_CYLINDER:
          child.scale.set(message.scale.x, message.scale.y, message.scale.z);
          break;
        case MARKER_LINE_STRIP:
        case MARKER_LINE_LIST:
          child.material.linewidth = message.scale.x;
          break;
        case MARKER_POINTS:
          child.material.size = message.scale.x;
          break;
        case MARKER_TEXT_VIEW_FACING:
        case MARKER_MESH_RESOURCE:
        case MARKER_TRIANGLE_LIST:
          // 这些类型的尺寸变化通常需要重建
          return false;
        default:
          break;
      }
    }

    // 更新点集
    switch (message.type) {
      case MARKER_CUBE_LIST:
      case MARKER_SPHERE_LIST: {
        const instancedMesh = child;
        if (message.points.length !== instancedMesh.count) {
          return false; // 点数量变化，需要重建
        }
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const scale = new THREE.Vector3(1, 1, 1);
        const quaternion = new THREE.Quaternion();
        for (let i = 0; i < message.points.length; i++) {
          position.set(message.points[i].x, message.points[i].y, message.points[i].z);
          matrix.compose(position, quaternion, scale);
          instancedMesh.setMatrixAt(i, matrix);
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        break;
      }
      case MARKER_LINE_STRIP:
      case MARKER_LINE_LIST:
      case MARKER_POINTS: {
        const geometry = child.geometry;
        const positions = geometry.getAttribute('position');
        if (message.points.length * 3 !== positions.count * positions.itemSize) {
          return false; // 点数量变化，需要重建
        }
        for (let i = 0; i < message.points.length; i++) {
          positions.setXYZ(i, message.points[i].x, message.points[i].y, message.points[i].z);
        }
        positions.needsUpdate = true;
        break;
      }
      default:
        break;
    }

    return true;
  }

  /**
   * 释放此标记中的元素内存
   */
  dispose() {
    // 遞放所有子对象的资源
    this.children.forEach((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      if (typeof child.dispose === 'function') {
        child.dispose();
      }
    });
    
    // 从场景中移除所有子对象（而非使用不存在的clear方法）
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }
  }
}
