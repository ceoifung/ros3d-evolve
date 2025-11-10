/**
 * @fileOverview ColorOcTree - 用于显示彩色ROS Octomap消息的组件。
 */

import * as THREE from "three";
import { OcTree } from "./OcTree.js";
import { getLogger } from "../utils/Logger.js";

const logger = getLogger("ColorOcTree");

/**
 * @class ColorOcTree
 * @description OcTree的子类，用于处理包含颜色信息的八叉树数据。
 * @extends OcTree
 */
export class ColorOcTree extends OcTree {
  /**
   * @override
   * @protected
   * @method _readNodeData
   * @description 从数据流中读取单个节点的数据（占据率和颜色）。
   * @param {InStream} stream - 输入流。
   * @returns {{occupancy: number, color: {r: number, g: number, b: number}}} 节点数据。
   */
  _readNodeData(stream) {
    const occupancy = stream.readFloat32();
    const r = stream.readUint8();
    const g = stream.readUint8();
    const b = stream.readUint8();
    return { occupancy, color: { r, g, b } };
  }

  /**
   * @override
   * @private
   * @method buildInstancedMesh
   * @description 根据解析出的叶子节点数据创建支持实例颜色的InstancedMesh。
   * @param {Array<object>} leafNodes - 包含位置、大小和颜色的叶子节点数组。
   */
  buildInstancedMesh(leafNodes) {
    if (leafNodes.length === 0) {
      return;
    }

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // 材质需要启用 vertexColors (对于InstancedMesh，这意味着它将使用实例颜色)
    const material = new THREE.MeshBasicMaterial({
      opacity: this.opacity,
      transparent: this.opacity < 1.0,
      vertexColors: true,
    });

    this.instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      leafNodes.length
    );
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    for (let i = 0; i < leafNodes.length; i++) {
      const { x, y, z, size, nodeData } = leafNodes[i];
      const position = new THREE.Vector3(x, y, z);
      const scale = new THREE.Vector3(size, size, size);
      const quaternion = new THREE.Quaternion();

      // 设置变换矩阵
      matrix.compose(position, quaternion, scale);
      this.instancedMesh.setMatrixAt(i, matrix);

      // 设置实例颜色
      const { r, g, b } = nodeData.color;
      this.instancedMesh.setColorAt(i, color.setRGB(r / 255, g / 255, b / 255));
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.instanceColor.needsUpdate = true;
    this.add(this.instancedMesh);
    logger.info(`Created InstancedMesh with ${leafNodes.length} ColorOcTree nodes.`);
  }
}
