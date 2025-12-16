/**
 * @fileOverview URDF - 用于加载和显示URDF模型的组件。
 */

import * as THREE from "three";
import * as ROSLIB from 'roslib';
import { SceneNode } from "@visualization/SceneNode.js";
import { MeshResource } from "@models/MeshResource.js";

/**
 * @class Urdf
 * @description 一个URDF对象，可用于将ROSLIB.UrdfModel及其关联模型加载到3D场景中。
 * @extends THREE.Object3D
 */
export class Urdf extends THREE.Object3D {
  /**
   * @param {object} options - 配置选项。
   * @param {ROSLIB.UrdfModel} options.urdfModel - 要加载的ROSLIB.UrdfModel。
   * @param {object} options.tfClient - 用于坐标变换的TF客户端。
   * @param {string} [options.path='/'] - 关联模型文件的基础路径。
   * @param {string} [options.tfPrefix=''] - 用于多机器人场景的TF前缀。
   */
  constructor(options = {}) {
    super();
    const { urdfModel, path = "/", tfClient, tfPrefix = "" } = options;

    if (!urdfModel) {
      console.error("Urdf constructor is missing urdfModel.");
      return;
    }

    // 遍历URDF模型中的所有链接
    for (const linkName in urdfModel.links) {
      const link = urdfModel.links[linkName];

      link.visuals.forEach((visual) => {
        if (visual && visual.geometry) {
          const frameID = `${tfPrefix}/${link.name}`;
          let mesh = null;

          if (visual.geometry.type === ROSLIB.URDF_MESH) {
            let uri = visual.geometry.filename;
            const tmpIndex = uri.indexOf("package://");
            if (tmpIndex !== -1) {
              uri = uri.substring(tmpIndex + "package://".length);
            }

            const colorMaterial = this.createMaterial(visual.material);
            mesh = new MeshResource({
              path,
              resource: uri,
              material: colorMaterial,
            });

            if (visual.geometry.scale) {
              mesh.scale.copy(visual.geometry.scale);
            }
          } else {
            mesh = this.createShapeMesh(visual);
          }

          if (mesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const sceneNode = new SceneNode({
              frameID,
              pose: visual.origin,
              tfClient,
              object: mesh,
            });
            sceneNode.name = visual.name;
            this.add(sceneNode);
          }
        }
      });
    }
  }

  /**
   * @private
   * @method createMaterial
   * @description 根据URDF中定义的材质信息创建THREE.js材质。
   * @param {object} material - URDF中的材质对象。
   * @returns {THREE.Material|null} 如果URDF中定义了颜色，则返回对应的 `MeshPhongMaterial` 或 `MeshBasicMaterial`。如果未定义，则返回 `null`，以便后续逻辑可以应用默认材质或使用网格内部的材质。
   */
  createMaterial(material) {
    if (material && material.color) {
      const { r, g, b, a } = material.color;
      const color = new THREE.Color(r, g, b);

      if (a < 1.0) {
        // 为支持透明度，使用 MeshBasicMaterial
        return new THREE.MeshBasicMaterial({
          color,
          opacity: a,
          transparent: true,
          depthWrite: true,
        });
      } else {
        // 对于不透明对象，使用受光照影响的 MeshPhongMaterial
        return new THREE.MeshPhongMaterial({
          color,
        });
      }
    }
    return null;
  }

  /**
   * @private
   * @method createShapeMesh
   * @description 根据URDF中的几何形状定义创建THREE.Mesh。
   * @param {object} visual - URDF中的visual对象。
   * @returns {THREE.Mesh|null} 创建的网格，如果形状不受支持则返回null。
   */
  createShapeMesh(visual) {
    // 尝试从URDF的visual定义中创建材质，如果未定义，则使用默认的黑色材质。
    const material = this.createMaterial(visual.material) || new THREE.MeshPhongMaterial({ color: 0x000000 });
    let shapeMesh = null;

    switch (visual.geometry.type) {
      case ROSLIB.URDF_BOX:
        const dim = visual.geometry.dimension;
        const boxGeom = new THREE.BoxGeometry(dim.x, dim.y, dim.z);
        shapeMesh = new THREE.Mesh(boxGeom, material);
        break;
      case ROSLIB.URDF_CYLINDER:
        const { radius, length } = visual.geometry;
        const cylGeom = new THREE.CylinderGeometry(radius, radius, length, 32);
        shapeMesh = new THREE.Mesh(cylGeom, material);
        shapeMesh.quaternion.setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          Math.PI / 2
        );
        break;
      case ROSLIB.URDF_SPHERE:
        const sphereGeom = new THREE.SphereGeometry(visual.geometry.radius, 32);
        shapeMesh = new THREE.Mesh(sphereGeom, material);
        break;
      default:
        console.warn(`Unsupported geometry type: ${visual.geometry.type}`);
        break;
    }
    return shapeMesh;
  }

  /**
   * @method dispose
   * @description 销毁此对象并释放所有相关资源。
   */
  dispose() {
    this.unsubscribeTf();
    this.children.forEach((child) => {
      if (typeof child.dispose === "function") {
        child.dispose();
      }
    });
  }

  /**
   * @method unsubscribeTf
   * @description 取消所有子SceneNode的TF订阅。
   */
  unsubscribeTf() {
    // 检查是否已经处理过，防止无限递归
    if (this._tfUnsubscribed) {
      return;
    }

    // 标记为已经处理
    this._tfUnsubscribed = true;

    // 只对SceneNode实例取消TF订阅，避免无限递归问题
    this.children.forEach((node) => {
      if (
        node instanceof SceneNode &&
        typeof node.unsubscribeTf === "function"
      ) {
        node.unsubscribeTf();
      }
    });

    // 重置标记，允许后续调用
    this._tfUnsubscribed = false;
  }
}
