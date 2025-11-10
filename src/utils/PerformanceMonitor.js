/**
 * @fileOverview
 *
 * 性能监控工具类，用于监测ROS3D.js组件的性能
 */

/**
 * 性能监控类
 */
export class PerformanceMonitor {
  /**
   * @param {number} sampleInterval - 采样间隔（毫秒）
   * @param {number} maxSamples - 最大采样数
   */
  constructor(sampleInterval = 1000, maxSamples = 60) {
    this.sampleInterval = sampleInterval;
    this.maxSamples = maxSamples;
    this.samples = [];
    this.isRunning = false;
    this.intervalId = null;
    
    // 性能统计
    this.stats = {
      fps: 0,
      avgFrameTime: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      memoryUsed: 0,
      gcCount: 0,
      gcTime: 0,
      totalFrames: 0,
      frameTimeSum: 0,
      frameTimeSamples: [],
    };
    
    // 记录上一次的时间点
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
  }

  /**
   * 开始监控
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.collectSample();
    }, this.sampleInterval);
    
    // 开始动画循环以监测帧率
    this.animate();
  }

  /**
   * 停止监控
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 动画循环，用于计算FPS
   */
  animate() {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    
    // 更新帧时间统计
    this.frameTimeSum += frameTime;
    this.stats.totalFrames++;
    
    if (frameTime < this.stats.minFrameTime) {
      this.stats.minFrameTime = frameTime;
    }
    if (frameTime > this.stats.maxFrameTime) {
      this.stats.maxFrameTime = frameTime;
    }
    
    // 计算FPS
    const elapsed = now - this.lastFpsUpdate;
    this.frameCount++;
    
    if (elapsed >= 1000) {
      this.stats.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.stats.avgFrameTime = this.frameTimeSum / this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      this.frameTimeSum = 0;
    }
    
    // 记录当前帧时间
    this.stats.frameTimeSamples.push(frameTime);
    if (this.stats.frameTimeSamples.length > this.maxSamples) {
      this.stats.frameTimeSamples.shift();
    }
    
    // 更新内存使用情况
    if (performance.memory) {
      this.stats.memoryUsed = performance.memory.usedJSHeapSize;
    }
    
    this.lastFrameTime = now;
    
    requestAnimationFrame(() => this.animate());
  }

  /**
   * 收集性能样本
   */
  collectSample() {
    // 在浏览器支持的情况下收集垃圾回收数据
    if (performance.getEntriesByType) {
      const gcEntries = performance.getEntriesByType('gc');
      if (gcEntries.length > 0) {
        const lastGc = gcEntries[gcEntries.length - 1];
        this.stats.gcCount++;
        this.stats.gcTime += lastGc.duration;
      }
    }
    
    // 保存当前统计到样本中
    const sample = {
      timestamp: Date.now(),
      fps: this.stats.fps,
      avgFrameTime: this.stats.avgFrameTime,
      minFrameTime: this.stats.minFrameTime,
      maxFrameTime: this.stats.maxFrameTime,
      memoryUsed: this.stats.memoryUsed,
      gcCount: this.stats.gcCount,
      gcTime: this.stats.gcTime,
      totalFrames: this.stats.totalFrames,
    };
    
    this.samples.push(sample);
    
    // 保持样本数量在限制范围内
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    
    // 重置最小/最大帧时间
    this.stats.minFrameTime = Infinity;
    this.stats.maxFrameTime = 0;
  }

  /**
   * 获取当前统计信息
   * @returns {Object} 统计信息对象
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 获取历史样本
   * @returns {Array} 性能样本数组
   */
  getSamples() {
    return [...this.samples];
  }

  /**
   * 重置所有统计信息
   */
  reset() {
    this.samples = [];
    this.stats = {
      fps: 0,
      avgFrameTime: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      memoryUsed: 0,
      gcCount: 0,
      gcTime: 0,
      totalFrames: 0,
      frameTimeSum: 0,
      frameTimeSamples: [],
    };
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
  }

  /**
   * 生成性能报告
   * @returns {string} 格式化的性能报告
   */
  generateReport() {
    if (this.samples.length === 0) {
      return '没有收集到性能数据。';
    }
    
    const latest = this.samples[this.samples.length - 1];
    const avgFps = this.samples.reduce((sum, s) => sum + s.fps, 0) / this.samples.length;
    const avgFrameTime = this.samples.reduce((sum, s) => sum + s.avgFrameTime, 0) / this.samples.length;
    
    return `
性能报告:
- 平均FPS: ${avgFps.toFixed(2)}
- 当前FPS: ${latest.fps}
- 平均帧时间: ${avgFrameTime.toFixed(2)}ms
- 当前帧时间: ${latest.avgFrameTime.toFixed(2)}ms
- 最小帧时间: ${latest.minFrameTime}ms
- 最大帧时间: ${latest.maxFrameTime}ms
- 当前内存使用: ${(latest.memoryUsed / 1024 / 1024).toFixed(2)}MB
- GC次数: ${latest.gcCount}
- GC总时间: ${latest.gcTime.toFixed(2)}ms
- 总帧数: ${latest.totalFrames}
    `;
  }
}