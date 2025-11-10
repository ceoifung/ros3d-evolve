import * as ROS3D from '@/index';
import * as THREE from 'three';

/**
 * @fileoverview 传感器数据测试场景
 * @description 展示 ROS3D.LaserScan 和 ROS3D.PointCloud2 的可视化。
 */

/**
 * 创建传感器数据测试场景
 * @param {HTMLElement} viewerContainer - 用于渲染3D视图的div容器。
 * @returns {object} 包含 `dispose` 方法的对象，用于清理场景。
 */
export function createSensorsScene(viewerContainer) {
  const viewer = new ROS3D.Viewer({
    divID: viewerContainer.id,
    width: viewerContainer.clientWidth,
    height: viewerContainer.clientHeight,
    antialias: true,
    background: '#282c34',
  });

  viewer.addObject(new ROS3D.Grid());
  viewer.addObject(new ROS3D.Axes());

  const sensorObjects = [];

  // 1. LaserScan 示例
  // 注意：LaserScan 通常需要 ROS 连接来接收数据。
  // 这里我们创建一个模拟的 LaserScan 对象进行可视化。
  const laserScan = new ROS3D.LaserScan({
    ros: null, // 在此示例中不连接ROS
    topic: '/scan',
    rootObject: viewer.scene,
    tfClient: null, // 在此示例中不使用TF
    material: new THREE.PointsMaterial({ size: 0.1, color: 0xff0000 }),
  });
  viewer.addObject(laserScan);
  sensorObjects.push(laserScan);

  // 模拟 LaserScan 数据
  const simulateLaserScan = () => {
    const ranges = [];
    const angle_min = -Math.PI / 2;
    const angle_max = Math.PI / 2;
    const angle_increment = Math.PI / 180;
    const range_min = 0.1;
    const range_max = 10.0;

    for (let angle = angle_min; angle <= angle_max; angle += angle_increment) {
      // 模拟一个简单的墙壁
      let range = 5.0;
      if (angle > -0.5 && angle < 0.5) {
        range = 3.0 + Math.sin(angle * 10) * 0.5; // 模拟一些起伏
      }
      ranges.push(Math.max(range_min, Math.min(range_max, range)));
    }

    const laserScanMessage = {
      header: { frame_id: 'laser_frame' },
      angle_min: angle_min,
      angle_max: angle_max,
      angle_increment: angle_increment,
      time_increment: 0,
      scan_time: 0,
      range_min: range_min,
      range_max: range_max,
      ranges: ranges,
      intensities: [],
    };
    laserScan.processMessage(laserScanMessage);
  };
  simulateLaserScan();

  // 2. PointCloud2 示例 (Z轴着色)
  const TURBO_COLORS = [
    '#3366FF', '#0099FF', '#00CCFF', '#00FFFF', '#66FFCC', '#66FF66',
    '#99FF33', '#FFFF00', '#FFAA00', '#FF6666'
  ];

  const createColormap = (palette, min, max) => {
    const colors = palette.map(hex => new THREE.Color(hex));
    return function(value) {
      if (value === undefined || value === null || isNaN(value)) {
        return new THREE.Color(0xffffff); // 无效值返回白色
      }
      const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
      if (colors.length === 1) {
        return colors[0];
      }
      const index = Math.floor(normalized * (colors.length - 1));
      const nextIndex = Math.min(colors.length - 1, index + 1);
      const t = (normalized * (colors.length - 1)) - index;
      
      const color1 = colors[index];
      const color2 = colors[nextIndex];

      return color1.clone().lerp(color2, t);
    }
  };

  // 使用更精确的数据范围来避免颜色被限制在两端
  const zMin = -1;
  const zMax = 5;
  const pointCloudColormap = createColormap(TURBO_COLORS, zMin, zMax);

  const pointCloud2 = new ROS3D.PointCloud2({
    ros: null,
    topic: '/points',
    rootObject: viewer.scene,
    tfClient: null,
    material: new THREE.PointsMaterial({ size: 0.05, vertexColors: true }),
    max_pts: 20000,
    colorsrc: 'z', // 使用z轴作为颜色来源
    colormap: pointCloudColormap, // 提供颜色映射函数
  });
  viewer.addObject(pointCloud2);
  sensorObjects.push(pointCloud2);

  // 模拟 PointCloud2 数据
  const simulatePointCloud2 = () => {
    const numPoints = 20000;
    const pointStep = 16; // 每个点的字节数 (x, y, z, intensity)
    const buffer = new ArrayBuffer(numPoints * pointStep);
    const dataView = new DataView(buffer);

    for (let i = 0; i < numPoints; i++) {
      const baseOffset = i * pointStep;

      // 随机生成点，形成一个球体形状
      const r = Math.random() * 2 + 1; // 半径 1 到 3
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi) + 2; // 范围大致在 -1 到 5 之间

      dataView.setFloat32(baseOffset + 0, x, true); // x at offset 0
      dataView.setFloat32(baseOffset + 4, y, true); // y at offset 4
      dataView.setFloat32(baseOffset + 8, z, true); // z at offset 8
      dataView.setFloat32(baseOffset + 12, z, true); // intensity at offset 12 (用z值模拟)
    }

    const pointCloud2Message = {
      header: { frame_id: 'camera_depth_frame' },
      height: 1,
      width: numPoints,
      fields: [
        { name: 'x', offset: 0, datatype: 7, count: 1 },
        { name: 'y', offset: 4, datatype: 7, count: 1 },
        { name: 'z', offset: 8, datatype: 7, count: 1 },
        { name: 'intensity', offset: 12, datatype: 7, count: 1 },
      ],
      is_bigendian: false,
      point_step: pointStep,
      row_step: pointStep * numPoints,
      data: buffer,
      is_dense: true,
    };

    pointCloud2.processMessage(pointCloud2Message);
  };
  simulatePointCloud2();

  return {
    dispose: () => {
      sensorObjects.forEach(obj => {
        viewer.scene.remove(obj);
        if (typeof obj.dispose === 'function') {
          obj.dispose();
        }
      });
      viewer.dispose();
    },
  };
}
