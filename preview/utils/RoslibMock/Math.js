/**
 * @fileOverview
 *
 * 模拟ROSLIB.Pose、Vector3、Quaternion和Transform类
 * 用于表示三维空间中的位置、方向和变换
 */

/**
 * 模拟ROSLIB.Vector3类
 * 表示三维向量
 */
export class Vector3 {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.z = options.z || 0;
  }

  /**
   * 克制向量
   */
  clone() {
    return new Vector3({ x: this.x, y: this.y, z: this.z });
  }

  /**
   * 设置向量值
   */
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  /**
   * 向量加法
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  /**
   * 向量减法
   */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  /**
   * 向量长度
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
}

/**
 * 模拟ROSLIB.Quaternion类
 * 表示四元数
 */
export class Quaternion {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.z = options.z || 0;
    this.w = options.w || 1;
  }

  /**
   * 克制四元数
   */
  clone() {
    return new Quaternion({ x: this.x, y: this.y, z: this.z, w: this.w });
  }

  /**
   * 设置四元数值
   */
  set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /**
   * 四元数乘法
   */
  multiply(q) {
    const x = this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y;
    const y = this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x;
    const z = this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w;
    const w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;

    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    return this;
  }

  /**
   * 四元数归一化
   */
  normalize() {
    const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    if (len === 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      this.x /= len;
      this.y /= len;
      this.z /= len;
      this.w /= len;
    }
    return this;
  }
}

/**
 * 模拟ROSLIB.Pose类
 * 表示三维空间中的位置和方向
 */
export class Pose {
  constructor(options = {}) {
    this.position = options.position || new Vector3();
    this.orientation = options.orientation || new Quaternion();
  }

  /**
   * 克制姿态
   */
  clone() {
    return new Pose({
      position: this.position.clone(),
      orientation: this.orientation.clone()
    });
  }

  /**
   * 应用变换
   */
  applyTransform(transform) {
    // 这里简化处理，仅作示例
    // 实际的变换计算会更复杂
    if (transform && transform.translation) {
      this.position.x += transform.translation.x;
      this.position.y += transform.translation.y;
      this.position.z += transform.translation.z;
    }
  }

  /**
   * 设置姿态
   */
  set(position, orientation) {
    if (position) this.position = position;
    if (orientation) this.orientation = orientation;
  }
}

/**
 * 模拟ROSLIB.Transform类
 * 表示坐标变换
 */
export class Transform {
  constructor(options = {}) {
    this.translation = options.translation || new Vector3();
    this.rotation = options.rotation || new Quaternion();
  }

  /**
   * 克制变换
   */
  clone() {
    return new Transform({
      translation: this.translation.clone(),
      rotation: this.rotation.clone()
    });
  }

  /**
   * 获取逆变换
   */
  inverse() {
    const invRotation = this.rotation.clone();
    invRotation.x = -invRotation.x;
    invRotation.y = -invRotation.y;
    invRotation.z = -invRotation.z;
    
    // 简化的逆变换计算
    const invTranslation = this.translation.clone();
    invTranslation.x *= -1;
    invTranslation.y *= -1;
    invTranslation.z *= -1;
    
    return new Transform({
      translation: invTranslation,
      rotation: invRotation
    });
  }

  /**
   * 设置变换
   */
  set(translation, rotation) {
    if (translation) this.translation = translation;
    if (rotation) this.rotation = rotation;
  }
}