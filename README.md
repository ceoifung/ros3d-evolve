## 概述

ROS3D-EVOLVE 库是基于官方 ros3djs 项目上重构后的产品，尽量保证对原版 API 和渲染功能效果完全兼容。

项目中定制详尽的重构计划和 API 的审核计划，编码和功能细节评审借助 AI 辅助实现，并且经过了渲染测试对比。项目上，主要改进包括使用 ES6 模块、Vite 构建工具、稍新一点的 Threejs 以及改进的代码架构。

## 升级内容

- 升级到roslib为2.0.1，适应build规范
- 修复laserScan的兼容性问题，默认throttle_rate由原先的null改为1
- 将`import ROSLIB from 'roslib'`;改为 `import * as ROSLIB from 'roslib'`;

## 主要特性

- 实时 3D 可视化 ROS 消息
- 机器人 URDF 模型渲染
- 传感器数据可视化 (LaserScan, PointCloud2 等)
- 交互式标记和控件
- 通过 Three.js 实现高性能 WebGL 渲染
- 模块化架构，支持 ES6 导入/导出

## 现代化

- **构建工具**: 使用 Vite 替换传统的 Grunt/Webpack 构建系统
- **模块系统**: 完全采用 ES6 模块，支持多种模块格式 (ESM, CJS, IIFE)
- **开发体验**: 提供热重载开发服务器和更快的构建速度
- **测试框架**: 使用 Vitest 替换传统的测试框架，提供更快的测试运行速度
- **代码结构**: 采用更清晰的模块化架构和文件组织结构
- **依赖管理**: 使用现代依赖管理工具，减少打包体积
- **TypeScript支持**: 代码使用现代 JavaScript 编写，具有强类型支持的潜力
- **现代化API**: 使用 modern JavaScript 语法和最佳实践

## 安装

### 使用 npm

```bash
npm install ros3d-evolve
```

### 使用 pnpm (推荐)

```bash
pnpm add ros3d-evolve
```

## 快速开始

### ES6 模块导入

```javascript
import * as ROSLIB from 'roslib';
import { Viewer, Grid, Axes } from 'ros3d-evolve';

// 创建 ROS 连接
const ros = new ROSLIB.Ros({
  url: 'ws://localhost:9090'
});

// 创建查看器
const viewer = new Viewer({
  divID: 'viewer-container',
  width: 800,
  height: 600,
  antialias: true,
  ros: ros,
  background: '#ffffff'
});

// 添加网格和坐标轴
const grid = new Grid({
  color: '#cccccc'
});
viewer.addObject(grid);

const axes = new Axes({
  scale: 1.5
});
viewer.addObject(axes);
```

## API 概览

### 主要组件

- `Viewer` - 带有相机控制的主 3D 查看器组件
- `SceneNode` - 场景中对象的基础类
- `Marker` - ROS 标记可视化
- `Grid`, `Axes`, `Arrow` - 基本 3D 模型
- `LaserScan`, `PointCloud2` - 传感器数据可视化
- `InteractiveMarker` - 交互式标记控制
- `Urdf` - 机器人模型可视化

### 查看器选项

```javascript
const viewer = new Viewer({
  divID: 'viewer-container',  // 容器元素ID
  width: 800,                // 宽度
  height: 600,               // 高度
  antialias: true,           // 抗锯齿
  background: '#ffffff',     // 背景颜色
  ros: ros,                  // ROS连接
  fixedFrame: 'map',         // 固定坐标系
  tf_rate: 10,               // TF更新频率
  intensity: 2.5,            // 光照强度
  near: 0.01,                // 相机近平面
  far: 1000,                 // 相机远平面
  cameraPose: { x: 3, y: 3, z: 7 }, // 相机初始位置
  cameraZoomSpeed: 0.5       // 相机缩放速度
});
```

## 开发

### 安装依赖

```bash
pnpm install
```

### 开发命令

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建的应用
pnpm preview

# 运行测试
pnpm test

# 以 UI 模式运行测试
pnpm test:ui
```

### 构建配置

项目使用 Vite 进行构建，支持多种模块格式：

- ES 模块 (`./dist/ros3d.es.js`)
- CommonJS (`./dist/ros3d.cjs.js`)
- IIFE (立即执行函数表达式) 用于浏览器使用 (`./dist/ros3d.iife.js`)

## 主要依赖

- Three.js (3D 渲染引擎)
- ROSLIB.js (ROS 通信)
- EventEmmitter3 (事件处理)
- loglevel (日志管理)

## 相关资源

- [官方 ros3djs 项目](http://wiki.ros.org/ros3djs)
- [ROSLIB.js](https://github.com/RobotWebTools/roslibjs)
