/**
 * @fileOverview
 *
 * ROS3D Mock Data Generator
 * 提供各种ROS消息类型的合理数据生成器
 */

/**
 * 生成Marker消息
 * @param {Object} options - 选项
 * @returns {Object} Marker消息
 */
export function createMockMarkerMessage(options = {}) {
  const {
    id = 0,
    type = 1, // CUBE
    ns = 'mock_markers',
    position = { x: 0, y: 0, z: 0 },
    orientation = { x: 0, y: 0, z: 0, w: 1 },
    scale = { x: 0.5, y: 0.5, z: 0.5 },
    color = { r: 1, g: 0, b: 0, a: 1 },
    action = 0, // ADD/MODIFY
    frame_id = 'map'
  } = options;

  return {
    header: {
      seq: Math.floor(Math.random() * 1000),
      stamp: {
        secs: Math.floor(Date.now() / 1000),
        nsecs: (Date.now() % 1000) * 1000000
      },
      frame_id: frame_id
    },
    ns: ns,
    id: id,
    type: type,
    action: action,
    pose: {
      position: position,
      orientation: orientation
    },
    scale: scale,
    color: color,
    lifetime: { secs: 0, nsecs: 0 },
    frame_locked: false
  };
}

/**
 * 生成LaserScan消息
 * @param {Object} options - 选项
 * @returns {Object} LaserScan消息
 */
export function createMockLaserScanMessage(options = {}) {
  const {
    frame_id = 'laser_frame',
    angle_min = -Math.PI / 2,
    angle_max = Math.PI / 2,
    angle_increment = Math.PI / 180, // 1度增量
    time_increment = 0,
    scan_time = 0.1,
    range_min = 0.1,
    range_max = 10.0,
    num_readings = 181 // 默认为181个点，从-angle_max到angle_max，每度一点
  } = options;

  // 模拟一个前方有障碍物的扫瞄模式
  const ranges = [];
  for (let i = 0; i < num_readings; i++) {
    const angle = angle_min + i * angle_increment;
    // 模拟一个前方有圆形障碍物的场景
    const distanceToObstacle = 3.0 + Math.sin(angle * 5) * 0.5; // 模拟起伏的"墙"
    const distance = Math.max(range_min, Math.min(range_max, distanceToObstacle));
    ranges.push(distance);
  }

  return {
    header: {
      stamp: {
        secs: Math.floor(Date.now() / 1000),
        nsecs: (Date.now() % 1000) * 1000000
      },
      frame_id: frame_id
    },
    angle_min: angle_min,
    angle_max: angle_max,
    angle_increment: angle_increment,
    time_increment: time_increment,
    scan_time: scan_time,
    range_min: range_min,
    range_max: range_max,
    ranges: ranges,
    intensities: new Array(num_readings).fill(100) // 强度填充值
  };
}

/**
 * 生成PointCloud2消息
 * @param {Object} options - 选项
 * @returns {Object} PointCloud2消息
 */
export function createMockPointCloud2Message(options = {}) {
  const {
    frame_id = 'camera_depth_frame',
    numPoints = 1000,
    position_variance = 2 // 点分布的方差
  } = options;

  // 定义字段
  const fields = [
    { name: 'x', offset: 0, datatype: 7, count: 1 }, // FLOAT32
    { name: 'y', offset: 4, datatype: 7, count: 1 },
    { name: 'z', offset: 8, datatype: 7, count: 1 },
    { name: 'rgb', offset: 16, datatype: 7, count: 1 } // FLOAT32 for packed RGB
  ];

  const pointStep = 32; // 每个点的字节数，根据fields定义
  const buffer = new ArrayBuffer(numPoints * pointStep);
  const dataView = new DataView(buffer);

  // 用于将RGB字节打包成一个float32
  const colorBuffer = new ArrayBuffer(4);
  const colorBytes = new Uint8Array(colorBuffer);
  const colorFloat = new Float32Array(colorBuffer);

  // 生成点数据
  for (let i = 0; i < numPoints; i++) {
    const baseOffset = i * pointStep;
    
    // 模拟一个球形点云
    const r = Math.random() * position_variance;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    dataView.setFloat32(baseOffset + 0, x, true); // x
    dataView.setFloat32(baseOffset + 4, y, true); // y
    dataView.setFloat32(baseOffset + 8, z, true); // z

    // 随机颜色
    colorBytes[0] = Math.floor(Math.random() * 255); // Blue
    colorBytes[1] = Math.floor(Math.random() * 255); // Green
    colorBytes[2] = Math.floor(Math.random() * 255); // Red
    colorBytes[3] = 255; // Alpha
    dataView.setFloat32(baseOffset + 16, colorFloat[0], true); // rgb
  }

  return {
    header: {
      stamp: {
        secs: Math.floor(Date.now() / 1000),
        nsecs: (Date.now() % 1000) * 1000000
      },
      frame_id: frame_id
    },
    height: 1,
    width: numPoints,
    fields: fields,
    is_bigendian: false,
    point_step: pointStep,
    row_step: pointStep * numPoints,
    data: new Uint8Array(buffer), // 必须是Uint8Array
    is_dense: true
  };
}

/**
 * 生成Path消息
 * @param {Object} options - 选项
 * @returns {Object} Path消息
 */
export function createMockPathMessage(options = {}) {
  const {
    frame_id = 'map',
    num_poses = 10,
    start_pos = { x: 0, y: 0, z: 0 }
  } = options;

  const poses = [];
  let current_x = start_pos.x;
  let current_y = start_pos.y;

  for (let i = 0; i < num_poses; i++) {
    // 模拟路径点（如螺旋形路径）
    const angle = i * 0.5;
    const radius = i * 0.2;
    current_x = start_pos.x + Math.cos(angle) * radius;
    current_y = start_pos.y + Math.sin(angle) * radius;
    const z = start_pos.z + i * 0.1;

    poses.push({
      header: { frame_id: frame_id, stamp: { secs: 0, nsecs: 0 } },
      pose: {
        position: { x: current_x, y: current_y, z: z },
        orientation: { x: 0, y: 0, z: Math.sin(angle * 0.5), w: Math.cos(angle * 0.5) }
      }
    });
  }

  return {
    header: {
      stamp: {
        secs: Math.floor(Date.now() / 1000),
        nsecs: (Date.now() % 1000) * 1000000
      },
      frame_id: frame_id
    },
    poses: poses
  };
}

/**
 * 生成Odometry消息
 * @param {Object} options - 选项
 * @returns {Object} Odometry消息
 */
export function createMockOdometryMessage(options = {}) {
  const {
    frame_id = 'odom',
    child_frame_id = 'base_link',
    position = { x: 0, y: 0, z: 0 },
    velocity = { x: 0.1, y: 0.0, z: 0.0 }
  } = options;

  // 模拟随时间变化的位置
  const time = Date.now() / 1000;
  const x = position.x + velocity.x * time;
  const y = position.y + velocity.y * time;
  const z = position.z + velocity.z * time;

  return {
    header: {
      stamp: {
        secs: Math.floor(time),
        nsecs: (time % 1) * 1000000
      },
      frame_id: frame_id
    },
    child_frame_id: child_frame_id,
    pose: {
      pose: {
        position: { x: x, y: y, z: z },
        orientation: { x: 0, y: 0, z: Math.sin(time * 0.1), w: Math.cos(time * 0.1) }
      },
      covariance: new Array(36).fill(0) // 6x6协方差矩阵
    },
    twist: {
      twist: {
        linear: velocity,
        angular: { x: 0, y: 0, z: 0.1 }
      },
      covariance: new Array(36).fill(0) // 6x6协方差矩阵
    }
  };
}

/**
 * 生成Pose消息
 * @param {Object} options - 选项
 * @returns {Object} Pose消息
 */
export function createMockPoseMessage(options = {}) {
  const {
    frame_id = 'map',
    position = { x: 0, y: 0, z: 0 },
    orientation = { x: 0, y: 0, z: 0, w: 1 }
  } = options;

  return {
    header: {
      stamp: {
        secs: Math.floor(Date.now() / 1000),
        nsecs: (Date.now() % 1000) * 1000000
      },
      frame_id: frame_id
    },
    pose: {
      position: position,
      orientation: orientation
    }
  };
}

// 预设的动态消息生成器
export const dynamicMessageGenerators = {
  marker: (id) => createMockMarkerMessage({ id, position: { x: Math.sin(Date.now()/1000)*2, y: Math.cos(Date.now()/1000)*2, z: 1 }}),
  laserScan: () => createMockLaserScanMessage(),
  pointCloud2: () => createMockPointCloud2Message({numPoints: 500}),
  path: () => createMockPathMessage(),
  odometry: () => createMockOdometryMessage(),
  pose: () => createMockPoseMessage({position: { x: Math.random()*5, y: Math.random()*5, z: 0.5 }})
};