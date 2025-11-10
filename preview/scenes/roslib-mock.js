import * as ROS3D from '@/index';
import * as THREE from 'three';
import { Ros as MockRos, TFClient, MessagePusher, Topic } from '../utils/RoslibMock/index.js';
import { dynamicMessageGenerators } from '../utils/RoslibMock/Messages.js';

/**
 * 创建ROSLIB Mock功能测试场景
 * 展示如何使用Mock库进行各种ROS消息的模拟
 * @param {HTMLElement} viewerContainer - 用于渲染3D视图的div容器。
 * @param {HTMLElement} controlsContainer - 放置UI控件的div容器。
 * @returns {object} 包含 `dispose` 方法的对象，用于清理场景。
 */
export function createRoslibMockScene(viewerContainer, controlsContainer) {
  // 创建模拟的ROS连接
  const mockRos = new MockRos({
    id: 'mock_test_ros'
  });
  
  // 创建TF客户端
  const tfClient = new TFClient({
    ros: mockRos,
    fixedFrame: 'map'
  });
  
  // 获取消息推送器
  const messagePusher = mockRos.getMessagePusher();

  // 创建3D场景
  const viewer = new ROS3D.Viewer({
    divID: viewerContainer.id,
    width: viewerContainer.clientWidth,
    height: viewerContainer.clientHeight,
    antialias: true,
    background: '#282c34',
    ros: mockRos,
    tfClient: tfClient, // 使用TFClient
    rootObject: new THREE.Object3D()
  });

  viewer.addObject(new ROS3D.Grid());
  viewer.addObject(new ROS3D.Axes());

  // 创建UI面板
  const panel = document.createElement('div');
  panel.className = 'rviz-panel';
  panel.innerHTML = `
    <div class="panel-row">
      <h3>ROSLIB Mock 功能测试</h3>
      <p>使用Mock库模拟各种ROS消息类型</p>
    </div>
    <div class="panel-row">
      <button id="startMarkersBtn" class="control-button">开始Marker测试</button>
      <button id="stopMarkersBtn" class="control-button">停止Marker测试</button>
    </div>
    <div class="panel-row">
      <button id="startLaserBtn" class="control-button">开始LaserScan测试</button>
      <button id="stopLaserBtn" class="control-button">停止LaserScan测试</button>
    </div>
    <div class="panel-row">
      <button id="startPointCloudBtn" class="control-button">开始PointCloud测试</button>
      <button id="stopPointCloudBtn" class="control-button">停止PointCloud测试</button>
    </div>
    <div class="panel-row">
      <label>模拟频率 (Hz): </label>
      <input type="number" id="simFrequency" value="30" min="1" max="120" />
    </div>
    <div class="panel-row">
      <div id="statusDiv" style="font-family: monospace; font-size: 12px;">
        状态: 等待测试启动...
      </div>
    </div>
  `;
  controlsContainer.appendChild(panel);

  // 获取DOM元素
  const startMarkersBtn = document.getElementById('startMarkersBtn');
  const stopMarkersBtn = document.getElementById('stopMarkersBtn');
  const startLaserBtn = document.getElementById('startLaserBtn');
  const stopLaserBtn = document.getElementById('stopLaserBtn');
  const startPointCloudBtn = document.getElementById('startPointCloudBtn');
  const stopPointCloudBtn = document.getElementById('stopPointCloudBtn');
  const simFrequencyInput = document.getElementById('simFrequency');
  const statusDiv = document.getElementById('statusDiv');

  // 状态管理
  let markerClient = null;
  let laserScanClient = null;
  let pointCloudClient = null;
  let markerPusher = null;
  let laserPusher = null;
  let pointCloudPusher = null;

  // 更新状态显示
  function updateStatus(message) {
    statusDiv.innerHTML = `状态: ${message}`;
  }

  // 创建Marker消息生成器
  function createMarkerMessageGenerator() {
    let id = 0;
    return () => {
      id = (id + 1) % 100; // ID循环使用0-99
      return dynamicMessageGenerators.marker(id);
    };
  }

  // 创建LaserScan消息生成器
  function createLaserScanMessageGenerator() {
    return () => {
      return dynamicMessageGenerators.laserScan();
    };
  }

  // 创建PointCloud2消息生成器
  function createPointCloudMessageGenerator() {
    return () => {
      return dynamicMessageGenerators.pointCloud2();
    };
  }

  // 启动Marker测试
  function startMarkerTest() {
    if (markerClient) return;
    
    updateStatus('启动Marker测试...');
    console.log('开始Marker测试...');
    
    // 获取模拟频率
    const frequency = parseInt(simFrequencyInput.value) || 30;
    console.log(`设置频率: ${frequency}Hz`);
    
    // 创建消息生成器并测试生成一条消息
    const msgGenerator = createMarkerMessageGenerator();
    const testMsg = msgGenerator();
    console.log('测试消息:', testMsg);
    
    // 创建Marker客户端 (这会内部创建一个Topic并订阅)
    console.log('准备创建MarkerClient...');
    try {
      markerClient = new ROS3D.MarkerClient({
        ros: mockRos,
        topic: '/mock_markers',
        tfClient: tfClient, // 使用TF客户端
        rootObject: viewer.scene
      });
      console.log('MarkerClient已创建', markerClient);
    } catch (error) {
      console.error('创建MarkerClient时出错:', error);
      return; // 如果创建失败，退出函数
    }
    
    console.log('开始推送消息...');
    // 使用消息推送器以指定频率推送marker消息
    markerPusher = messagePusher.pushMessageAtFrequency(
      '/mock_markers',
      msgGenerator,
      frequency
    );
    console.log('消息推送器已启动');

    updateStatus(`Marker测试运行中 (${frequency}Hz)...`);
  }

  // 停止Marker测试
  function stopMarkerTest() {
    if (!markerClient) return;
    
    if (markerPusher) {
      markerPusher.stop();
      markerPusher = null;
    }
    
    markerClient.dispose();
    markerClient = null;
    
    updateStatus('Marker测试已停止');
  }

  // 启动LaserScan测试
  function startLaserTest() {
    if (laserScanClient) return;
    
    updateStatus('启动LaserScan测试...');
    
    // 创建LaserScan客户端
    laserScanClient = new ROS3D.LaserScan({
      ros: mockRos,
      topic: '/mock_scan',
      tfClient: tfClient, // 使用TF客户端
      rootObject: viewer.scene,
      material: new THREE.PointsMaterial({ size: 0.05, color: 0xff0000 })
    });

    // 获取模拟频率
    const frequency = parseInt(simFrequencyInput.value) || 10;
    
    // 使用消息推送器以指定频率推送LaserScan消息
    laserPusher = messagePusher.pushMessageAtFrequency(
      '/mock_scan',
      createLaserScanMessageGenerator(),
      frequency
    );

    updateStatus(`LaserScan测试运行中 (${frequency}Hz)...`);
  }

  // 停止LaserScan测试
  function stopLaserTest() {
    if (!laserScanClient) return;
    
    if (laserPusher) {
      laserPusher.stop();
      laserPusher = null;
    }
    
    laserScanClient.dispose();
    laserScanClient = null;
    
    updateStatus('LaserScan测试已停止');
  }

  // 启动PointCloud测试
  function startPointCloudTest() {
    if (pointCloudClient) return;
    
    updateStatus('启动PointCloud测试...');
    
    // 创建PointCloud2客户端
    pointCloudClient = new ROS3D.PointCloud2({
      ros: mockRos,
      topic: '/mock_points',
      tfClient: tfClient, // 使用TF客户端
      rootObject: viewer.scene,
      material: new THREE.PointsMaterial({ size: 0.02, vertexColors: true }),
      max_pts: 10000
    });

    // 获取模拟频率
    const frequency = parseInt(simFrequencyInput.value) || 5;
    
    // 使用消息推送器以指定频率推送PointCloud消息
    pointCloudPusher = messagePusher.pushMessageAtFrequency(
      '/mock_points',
      createPointCloudMessageGenerator(),
      frequency
    );

    updateStatus(`PointCloud测试运行中 (${frequency}Hz)...`);
  }

  // 停止PointCloud测试
  function stopPointCloudTest() {
    if (!pointCloudClient) return;
    
    if (pointCloudPusher) {
      pointCloudPusher.stop();
      pointCloudPusher = null;
    }
    
    pointCloudClient.dispose();
    pointCloudClient = null;
    
    updateStatus('PointCloud测试已停止');
  }

  // 绑定事件监听器
  startMarkersBtn.addEventListener('click', startMarkerTest);
  stopMarkersBtn.addEventListener('click', stopMarkerTest);
  startLaserBtn.addEventListener('click', startLaserTest);
  stopLaserBtn.addEventListener('click', stopLaserTest);
  startPointCloudBtn.addEventListener('click', startPointCloudTest);
  stopPointCloudBtn.addEventListener('click', stopPointCloudTest);

  return {
    dispose: () => {
      // 停止所有测试
      stopMarkerTest();
      stopLaserTest();
      stopPointCloudTest();
      
      // 清理客户端
      if (markerClient) {
        markerClient.dispose();
      }
      if (laserScanClient) {
        laserScanClient.dispose();
      }
      if (pointCloudClient) {
        pointCloudClient.dispose();
      }
      
      // 清理TF客户端
      if (tfClient) {
        tfClient.dispose();
      }
      
      // 关闭模拟的ROS连接
      mockRos.close();
      
      // 清理viewer
      viewer.dispose();
    },
  };
}