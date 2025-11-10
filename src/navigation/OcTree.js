/**
 * @fileOverview OcTree - 用于显示ROS Octomap消息的核心组件。
 */

import * as THREE from "three";
import { getLogger } from "../utils/Logger.js";

const logger = getLogger("OcTree");

// 一个用于流式读取ArrayBuffer的辅助类
class InStream {
  constructor(arrayBuffer) {
    this.dataView = new DataView(arrayBuffer);
    this.cursor = 0;
  }

  readUint8() {
    const value = this.dataView.getUint8(this.cursor, true);
    this.cursor += 1;
    return value;
  }

  readFloat32() {
    const value = this.dataView.getFloat32(this.cursor, true);
    this.cursor += 4;
    return value;
  }
}

/**
 * @class OcTree
 * @description 将 `octomap_msgs/Octomap` 消息解析并渲染为 `InstancedMesh`。
 * @extends THREE.Object3D
 */
export class OcTree extends THREE.Object3D {
  /**
   * @param {object} options - 配置选项。
   * @param {object} options.message - Octomap 消息。
   * @param {object} [options.color] - 体素的颜色。
   * @param {number} [options.opacity=1.0] - 体素的不透明度。
   */
  constructor(options = {}) {
    super();
    const { message, color = { r: 0, g: 255, b: 0 }, opacity = 1.0 } = options;

    this.resolution = message.resolution;
    this.color = new THREE.Color(color.r / 255, color.g / 255, color.b / 255);
    this.opacity = opacity;
    this.occupancyThreshold = 0.5; // 默认占据阈值

    // 根据消息类型选择解析方法
    if (message.binary) {
      logger.warn("Binary OcTree format not yet supported in this version.");
      return;
    } else {
      this.parseFull(message.data);
    }
  }

  /**
   * @method dispose
   * @description 释放所有Three.js资源。
   */
  dispose() {
    if (this.instancedMesh) {
      this.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      this.instancedMesh.material.dispose();
      this.instancedMesh = null;
    }
  }

  /**
   * @private
   * @method parseFull
   * @description 解析完整的（非二进制）八叉树数据。
   * @param {Uint8Array} data - 消息中的数据负载。
   */
  parseFull(data) {
    const stream = new InStream(data.buffer);
    const leafNodes = [];
    const treeDepth = 16;
    const treeMaxKeyVal = 1 << (treeDepth - 1);

    // 递归解析函数
    const parseNode = (depth, key) => {
      // 读取节点数据
      const nodeData = this._readNodeData(stream);
      const occupancy = typeof nodeData === 'object' ? nodeData.occupancy : nodeData;

      // 读取子节点存在掩码
      const childExistsMask = stream.readUint8();

      // 如果是叶子节点
      if (childExistsMask === 0) {
        if (occupancy >= this.occupancyThreshold) {
          const size = this.resolution * (1 << (treeDepth - 1 - depth));
          const x = (key[0] - treeMaxKeyVal) * this.resolution + size / 2;
          const y = (key[1] - treeMaxKeyVal) * this.resolution + size / 2;
          const z = (key[2] - treeMaxKeyVal) * this.resolution + size / 2;
          leafNodes.push({ x, y, z, size, nodeData });
        }
        return;
      }

      // 如果有子节点，则递归
      for (let i = 0; i < 8; i++) {
        if (childExistsMask & (1 << i)) {
          const newKey = [...key];
          const diff = treeDepth - depth - 1;
          if (i & 1) newKey[0] += (1 << diff);
          if (i & 2) newKey[1] += (1 << diff);
          if (i & 4) newKey[2] += (1 << diff);
          parseNode(depth + 1, newKey);
        }
      }
    };

    // 从根节点开始解析，根节点的键是原点
    const initialKey = [treeMaxKeyVal, treeMaxKeyVal, treeMaxKeyVal];
    parseNode(0, initialKey);

    this.buildInstancedMesh(leafNodes);
  }

  /**
   * @protected
   * @method _readNodeData
   * @description 从数据流中读取单个节点的数据（占据率）。
   * @param {InStream} stream - 输入流。
   * @returns {number} 占据率值。
   */
  _readNodeData(stream) {
    return stream.readFloat32();
  }

  /**
   * @private
   * @method buildInstancedMesh
   * @description 根据解析出的叶子节点数据创建InstancedMesh。
   * @param {Array<object>} leafNodes - 包含位置和大小的叶子节点数组。
   */
  buildInstancedMesh(leafNodes) {
    if (leafNodes.length === 0) {
      return;
    }

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      opacity: this.opacity,
      transparent: this.opacity < 1.0,
    });

    this.instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      leafNodes.length
    );
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const matrix = new THREE.Matrix4();
    for (let i = 0; i < leafNodes.length; i++) {
      const { x, y, z, size } = leafNodes[i];
      const position = new THREE.Vector3(x, y, z);
      const scale = new THREE.Vector3(size, size, size);
      const quaternion = new THREE.Quaternion(); // 无旋转
      matrix.compose(position, quaternion, scale);
      this.instancedMesh.setMatrixAt(i, matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.add(this.instancedMesh);
    logger.info(`Created InstancedMesh with ${leafNodes.length} OcTree nodes.`);
  }
}
