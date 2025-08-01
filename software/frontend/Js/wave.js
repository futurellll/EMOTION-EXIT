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

const backendUrl = "[serverHost]:[port]";

let allDevices = [null, null, null];
window.waveAPI.onDeviceList((devices) => {
    allDevices = [null, null, null];
    // devices.forEach(function() {
    //     console.log("name:" + this["name"]);
    //     switch(this["name"]){
    //         case "ESP32-1":
    //             allDevices[0] = this;
    //             break;
    //         case "ESP32-2":
    //             allDevices[1] = this;
    //             break;
    //         case "ESP32-3":
    //             allDevices[2] = this;
    //             break;
    //     }
    // });
    for(let i = 0; i < 3; i++){
        if(devices[i]){
            switch(devices[i]["name"]){
                case "ESP32-1":
                    allDevices[0] = devices[i];
                    break;
                case "ESP32-2":
                    allDevices[1] = devices[i];
                    break;
                case "ESP32-3":
                    allDevices[2] = devices[i];
                    break;
            }
        }
    }
});

let datas = [];
async function fetchBciData() {

  try {
    //console.log('发起请求:', backendUrl + '/emotion/bci');
    
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
    //console.log('响应数据:', result.body);
    // 在这里处理数据（例如更新波形图）
    // updateAllWaveformsWithExternalData(/* 从 result.body 提取的数据 */);
    const dataArray = [result.body["Attention"] * 100, 
                        result.body["Engagement"] * 100, 
                        result.body["Excitement"] * 100, 
                        result.body["Interest"] * 100, 
                        result.body["Relaxation"] * 100, 
                        result.body["Stress"] * 100
                    ];
    if(dataArray){
        datas[0] = dataArray;
    }else{
        datas[0] = null;
    }
    updateAllWaveformsWithExternalData(dataArray);
  } catch (error) {
    console.error('Fetch error:', error.message);
    // 可在这里添加 UI 错误提示
  }
}

async function fetchIntensityData(){
    try {
    console.log('发起请求:', backendUrl + '/emotion/intensity');
    
    // 调用预加载脚本暴露的 fetch
    const result = await window.electronAPI.fetch(
      backendUrl + '/emotion/intensity',
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
    console.log('响应数据:', result.body["intensity"]);
    const intensityData = Math.round(result.body["intensity"] * 100);

    if(intensityData){
        datas[1] = intensityData;
    }else{
        datas[1] = null;
    }
    $("#intensityInnerBar").animate({
        width: intensityData + "%",
    }, 850);
    document.getElementById("intensityNum").innerHTML = intensityData + "%";

    } catch (error) {
        console.error('Fetch error:', error.message);
    }
}

async function fetchCvData(){
    try {
    console.log('发起请求:', backendUrl + '/emotion/cv');
    
    // 调用预加载脚本暴露的 fetch
    const result = await window.electronAPI.fetch(
      backendUrl + '/emotion/cv',
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
    console.log('响应数据:', result.body["emotion"]);
    const cvData = result.body["emotion"];

    if(cvData){
        datas[2] = cvData;
    }else{
        datas[2] = null;
    }
    let what2Display
    switch(cvData) {
        case "angry":
            what2Display = "愤怒";
            break;
        case "disgust":
            what2Display = "厌恶";
            break;
        case "fear":
            what2Display = "恐惧";
            break;
        case "happy":
            what2Display = "快乐";
            break;
        case "sad":
            what2Display = "悲伤";
            break;
        case "surprise":
            what2Display = "惊讶";
            break;
        case "neutral":
            what2Display = "平静";
            break;
        default :
            what2Display = "故国神游";
    }
    document.getElementById("emotionType").innerHTML = what2Display;

    } catch (error) {
        console.error('Fetch error:', error.message);
    }
}

function sendCmd2Esp(data){
    //console.log("waiting for sending:" + data[1]);
    console.log(allDevices);
    let buffer1 = [null, null];
    let buffer2 = [null, null];
    let buffer3 = [null, null];

    buffer1[0] = data[1];        //修改这里以调整发送的数据
    buffer1[1] = data[1];

    buffer2[0] = data[1];        //修改这里以调整发送的数据
    buffer2[1] = data[1];

    buffer3[0] = data[1];        //修改这里以调整发送的数据
    buffer3[1] = data[1];

    if(allDevices[0] != null){
        window.electronAPI.sendToDevice(allDevices[0]["id"], buffer1[0] + "|" + buffer1[1] + "\n");
    }
    if(allDevices[1] != null){
        window.electronAPI.sendToDevice(allDevices[1]["id"], buffer2[0] + "|" + buffer2[1] + "\n");
    }
    if(allDevices[2] != null){
        window.electronAPI.sendToDevice(allDevices[2]["id"], buffer3[0] + "|" + buffer3[1] + "\n");
    }
}

function resetAllWaveforms() {
    // 1. 重置外部数据存储为0
    Object.keys(externalData).forEach(key => {
        externalData[key] = 0;
    });

    // 2. 逐个处理每个波形图实例
    waveInstances.forEach(wave => {
        // 强制所有历史数据点为0
        wave.waveData = wave.waveData.map(() => 0);
        
        // 重置显示值为0.0
        wave.valueDisplay.textContent = '0.0';
        
        // 标记使用外部数据（确保后续数据更新正常）
        wave.useExternalData = true;
        
        // 立即重新绘制波形（无论是否在运行状态）
        wave.drawWave();
    });

    console.log('所有波形图已清零');
}
function resetIntensityBar() {
    $("#intensityInnerBar").stop(true,true).animate({
        width: "0%",
    }, 1000);
    document.getElementById("intensityNum").innerHTML = "0%";
}
function resetCvBlock() {
    document.getElementById("emotionType").innerHTML = "故国神游";
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
            <div class="relative w-[220px] h-[135px] bg-darkCard rounded-lg shadow-md overflow-hidden border-2 border-darkBorder ml-[12px]">
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
            this.waveData.push(0);
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
let bciDataGetTimer
let intensityGetTimer
let cvGetTimer
let espSendTimer
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
        clearInterval(bciDataGetTimer);  //重置定时器
        clearInterval(intensityGetTimer);
        clearInterval(cvGetTimer);
        clearInterval(espSendTimer);

        resetAllWaveforms();             //所有数据显示复位
        resetIntensityBar();
        resetCvBlock();

        for(let i = 0; i < 3; i++){
            if(allDevices[i] != null){
                 window.electronAPI.sendToDevice(allDevices[i]["id"], "0|0\n");
            }
        }

        // toggleBtn.querySelector('span').textContent = '全部暂停';
        // toggleBtn.querySelector('i').className = 'fa fa-pause mr-2';
        // toggleBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        // toggleBtn.classList.remove('bg-primary', 'hover:bg-primary/90');
        document.getElementById("mainButton").innerHTML = "Get Started";


    } else {
        bciDataGetTimer = setInterval(function(){  //设置脑波获取定时器
            fetchBciData();
        }, config.updateInterval);
        intensityGetTimer = setInterval(function(){ //设置情绪强度获取定时器
            fetchIntensityData();
        }, config.updateInterval);
        cvGetTimer = setInterval(function(){        //设置情绪类型获取定时器
            fetchCvData();
        }, config.updateInterval);
        espSendTimer = setInterval(function(){      //设置esp32发信定时器
            sendCmd2Esp(datas);
        }, config.updateInterval);

        // toggleBtn.querySelector('span').textContent = '全部开始';
        // toggleBtn.querySelector('i').className = 'fa fa-play mr-2';
        // toggleBtn.classList.add('bg-primary', 'hover:bg-primary/90');
        // toggleBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        document.getElementById("mainButton").innerHTML = "Shut Up";
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
