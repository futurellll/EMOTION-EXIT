// 全局配置参数
const config = {
    canvasWidth: 220,
    canvasHeight: 135,
    updateInterval: 1000, // 更新间隔(ms)
    maxValue: 100, // 最大值
    pointSpacing: 10, // 点间距和网格大小
    gridColor: '#334155', // 暗色主题网格颜色
    rowCount: 2, // 行数
    colCount: 3, // 列数
    horizontalGap: 20, // 水平间距(px)
    verticalGap: 20, // 垂直间距(px)
    // 每个波形图的配置
    waveforms: [
        { id: 0, title: "ATTENTION", lineColor: '#3B82F6', fillColor: 'rgba(59, 130, 246, 0.3)', dataSource: 'data1' },
        { id: 1, title: "ENGAGEMENT", lineColor: '#10B981', fillColor: 'rgba(16, 185, 129, 0.3)', dataSource: 'data2' },
        { id: 2, title: "EXCITEMENT", lineColor: '#EF4444', fillColor: 'rgba(239, 68, 68, 0.3)', dataSource: 'data3' },
        { id: 3, title: "INTEREST", lineColor: '#8B5CF6', fillColor: 'rgba(139, 92, 246, 0.3)', dataSource: 'data4' },
        { id: 4, title: "RELAXATION", lineColor: '#F59E0B', fillColor: 'rgba(245, 158, 11, 0.3)', dataSource: 'data5' },
        { id: 5, title: "STRESS", lineColor: '#EC4899', fillColor: 'rgba(236, 72, 153, 0.3)', dataSource: 'data6' }
    ]
};

// 存储所有波形图实例
const waveInstances = [];

// 外部数据存储
const externalData = {
    data1: null,
    data2: null,
    data3: null,
    data4: null,
    data5: null,
    data6: null
};

const backendUrl = "http://192.168.137.206:8000";

async function fetchData() {
  try {
    console.log('发起请求:', backendUrl + '/emotion/bci');
    
    // 调用预加载脚本暴露的 fetch
    const result = await window.electronAPI.fetch(
      backendUrl + '/emotion/bci',
      { 
        method: 'GET',
        timeout: 5000 // 超时时间 5 秒
      }
    );
    
    // 检查是否有网络错误（如连接失败）
    if (result.error) {
      throw new Error(`网络请求失败: ${result.error}`);
    }
    
    // 检查 HTTP 状态码（此时 result.status 一定存在）
    if (!result.ok) {
      throw new Error(`服务器错误: 状态码 ${result.status}`);
    }
    
    // 成功获取数据
    console.log('响应数据:', result.body);
    // 在这里处理数据（例如更新波形图）
    // updateAllWaveformsWithExternalData(/* 从 result.body 提取的数据 */);
    const dataArrey = [result.body["Attention"] * 100, 
                        result.body["Engagement"] * 100, 
                        result.body["Excitement"] * 100, 
                        result.body["Interest"] * 100, 
                        result.body["Relaxation"] * 100, 
                        result.body["Stress"] * 100
                    ];
    updateAllWaveformsWithExternalData(dataArrey);
  } catch (error) {
    console.error('Fetch error:', error.message);
    // 可在这里添加 UI 错误提示
  }
}

// 波形图类
class Waveform {
    constructor(id, title, lineColor, fillColor, dataSource) {
        this.id = id;
        this.title = title;
        this.lineColor = lineColor;
        this.fillColor = fillColor;
        this.dataSource = dataSource; // 数据来源标识
        this.waveData = [];
        this.isRunning = false;
        this.animationId = null;
        this.lastUpdateTime = 0;
        this.useExternalData = false; // 是否使用外部数据
        
        this.init();
    }
    
    // 初始化波形图
    init() {
        // 创建容器元素
        const container = document.createElement('div');
        container.className = 'wave-item';
        container.innerHTML = `
            <div class="flex items-center justify-between w-full px-1 mb-1">
                <div class="flex items-center">
                    <h2 class="text-sm font-semibold text-white mr-1.5">${this.title}</h2>
                    <span class="latest-value text-xs bg-darkCard px-1.5 py-0.5 rounded text-gray-200 border border-darkBorder">0.0</span>
                </div>
            </div>
            <div class="relative w-[220px] h-[135px] bg-darkCard rounded-lg shadow-md overflow-hidden border-2 border-darkBorder">
                <canvas class="wave-canvas absolute inset-0"></canvas>
            </div>
        `;
        
        document.getElementById('waveContainer').appendChild(container);
        
        // 获取DOM元素
        this.canvas = container.querySelector('.wave-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.valueDisplay = container.querySelector('.latest-value');
        
        // 设置画布尺寸
        this.canvas.width = config.canvasWidth;
        this.canvas.height = config.canvasHeight;
        
        // 初始化波形数据
        this.initWaveData();

        this.drawWave();
    }
    
    // 初始化波形数据
    initWaveData() {
        this.waveData = [];
        const pointsCount = Math.ceil(this.canvas.width / config.pointSpacing) + 1;
        
        for (let i = 0; i < pointsCount; i++) {
            this.waveData.push(this.getRandomValue());
        }
    }
    
    // 使用外部数据更新波形
    updateWithExternalData(value) {
        // 确保数值在有效范围内
        const clampedValue = Math.max(0, Math.min(value, config.maxValue));
        this.waveData.unshift(clampedValue);
        this.waveData.pop();
        
        // 更新最新值显示
        this.valueDisplay.textContent = clampedValue.toFixed(1);
        
        // 标记使用外部数据
        this.useExternalData = true;
        
        // 如果未运行，则更新一次波形
        if (!this.isRunning) {
            this.drawWave();
        }
    }
    
    // 生成随机值（仅在没有外部数据时使用）
    getRandomValue() {
        // 如果有外部数据，则使用外部数据
        if (this.useExternalData && externalData[this.dataSource] !== null) {
            return externalData[this.dataSource];
        }
        
        // 为不同波形图设置不同的数据分布特性
        if (this.id === 0) return Math.random() * config.maxValue; // 随机
        if (this.id === 1) return 50 + Math.sin(Date.now() / 1000) * 30; // 正弦波
        if (this.id === 2) return Math.abs(Math.sin(Date.now() / 1000) * config.maxValue); // 脉动
        if (this.id === 3) return Math.random() > 0.7 ? 80 + Math.random() * 20 : Math.random() * 40; // 脉冲
        if (this.id === 4) return 20 + Math.sin(Date.now() / 1500) * 30 + Math.random() * 10; // 波动
        return Math.random() * 50 + 50 * Math.random(); // 默认
    }
    
    // 更新波形数据
    updateWaveData() {
        const newValue = this.getRandomValue();
        this.waveData.unshift(newValue);
        this.waveData.pop();
        
        // 更新最新值显示
        this.valueDisplay.textContent = newValue.toFixed(1);
    }
    
    // 绘制背景网格
    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = config.gridColor;
        this.ctx.lineWidth = 1;
        
        // 绘制垂直线
        for (let x = 0; x <= this.canvas.width; x += config.pointSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= this.canvas.height; y += config.pointSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    // 绘制波形
    drawWave() {
        // 绘制背景网格
        this.drawGrid();
        
        // 绘制填充区域
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - (this.waveData[0] / config.maxValue) * this.canvas.height);
        
        for (let i = 1; i < this.waveData.length; i++) {
            this.ctx.lineTo(
                this.canvas.width - i * config.pointSpacing, 
                this.canvas.height - (this.waveData[i] / config.maxValue) * this.canvas.height
            );
        }
        
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        
        this.ctx.fillStyle = this.fillColor;
        this.ctx.fill();
        
        // 绘制波形线
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width, this.canvas.height - (this.waveData[0] / config.maxValue) * this.canvas.height);
        
        for (let i = 1; i < this.waveData.length; i++) {
            this.ctx.lineTo(
                this.canvas.width - i * config.pointSpacing, 
                this.canvas.height - (this.waveData[i] / config.maxValue) * this.canvas.height
            );
        }
        
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    // 动画循环
    animate(timestamp) {
        if (this.isRunning) {
    
            if (!this.lastUpdateTime || timestamp - this.lastUpdateTime >= config.updateInterval) {
                //this.updateWaveData();
                
                this.drawWave();
                this.lastUpdateTime = timestamp;
                
            }
            this.animationId = requestAnimationFrame(timestamp => this.animate(timestamp));
        }
    }
    
    // 切换动画状态
    toggleAnimation() {
        this.isRunning = !this.isRunning;
        
        if (this.isRunning) {
            this.lastUpdateTime = 0;
            this.animate();
        } else {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }
}

// 初始化所有波形图
function initAllWaveforms() {
    config.waveforms.forEach(waveConfig => {
        const wave = new Waveform(
            waveConfig.id, 
            waveConfig.title, 
            waveConfig.lineColor, 
            waveConfig.fillColor,
            waveConfig.dataSource
        );
        waveInstances.push(wave);
    });
    
    // 设置全局控制按钮
    document.getElementById('mainButton').addEventListener('click', toggleAllWaveforms);
}

// 全局控制所有波形图
let dataGetTimer
function toggleAllWaveforms() {
    const allRunning = waveInstances.every(wave => wave.isRunning);
    const newState = !allRunning;
    
    waveInstances.forEach(wave => {
        if (wave.isRunning !== newState) {
            wave.toggleAnimation();
        }
    });
    
    const toggleBtn = document.getElementById('toggleAllBtn');
    if (!newState) {
        dataGetTimer = setInterval(function(){
        updateAllWaveformsWithExternalData(fetchData());
        }, 1000);
        toggleBtn.querySelector('span').textContent = '全部开始';
        toggleBtn.querySelector('i').className = 'fa fa-play mr-2';
        toggleBtn.classList.add('bg-primary', 'hover:bg-primary/90');
        toggleBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
    } else {
        clearInterval(dataGetTimer);
        toggleBtn.querySelector('span').textContent = '全部暂停';
        toggleBtn.querySelector('i').className = 'fa fa-pause mr-2';
        toggleBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        toggleBtn.classList.remove('bg-primary', 'hover:bg-primary/90');
    }
}

// 从外部更新所有波形图数据的函数
function updateAllWaveformsWithExternalData(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length !== 6) {
        console.error('需要提供包含6个数据的数组');
        return;
    }
    
    // 更新外部数据存储
    externalData.data1 = dataArray[0];
    externalData.data2 = dataArray[1];
    externalData.data3 = dataArray[2];
    externalData.data4 = dataArray[3];
    externalData.data5 = dataArray[4];
    externalData.data6 = dataArray[5];
    
    // 更新每个波形图
    waveInstances.forEach(wave => {
        const value = externalData[wave.dataSource];
        if (value !== null) {
            wave.updateWithExternalData(value);
        }
    });
}

// 页面加载完成后初始化
$(document).ready(initAllWaveforms);