const { app, BrowserWindow, ipcMain } = require('electron');
const net = require('net');
const path = require('path');

let mainWindow;
let server;
let clients = new Map(); // 存储所有ESP32客户端


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1430,
    height: 900,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false // 启用Node集成
    }
  });

  mainWindow.loadFile('index.html');
  //mainWindow.webContents.openDevTools(); // 打开开发者工具，方便调试
  
  // 发送设备列表到前端
  sendDeviceList();
  console.log("$$window created");
}


// 创建TCP服务器
function createServer() {
  server = net.createServer((socket) => {
    // 生成唯一设备ID
    const deviceId = `ESP_${Date.now().toString(16)}`;
    
    // 存储客户端信息
    const clientInfo = {
      id: deviceId,
      socket,
      ip: socket.remoteAddress,
      port: socket.remotePort,
      connectedAt: new Date(),
      lastSeen: new Date(),
      status: 'online',
      name: 'Unknown device',
      type: 'unknown' // 设备类型（ESP1或ESP2）
    };
    
    clients.set(deviceId, clientInfo);
    console.log(`new device connecting: ${deviceId} (${socket.remoteAddress}:${socket.remotePort})`);
    //sendDeviceList();
    console.log("$$device on");
    
    // 发送欢迎消息并请求设备信息
    socket.write(`HELLO:${deviceId}\n`);
    
    // 监听数据接收
    socket.on('data', (data) => {
      const message = data.toString('utf8').trim();
      clientInfo.lastSeen = new Date();
      console.log(`from ${deviceId} received: ${message}`);
      
      // 解析消息（格式: [CMD]:[PARAMS]）
      const [command, params] = message.split(':');
      
      switch(command) {
        case 'IDENTIFY':
          // 设备身份确认
          clientInfo.name = params || 'Unknown device';
          sendDeviceList();
          console.log("$$identify");
          break;
          
        case 'DATA':
          // 转发设备数据到前端
          mainWindow.webContents.send('device-data', {
            deviceId,
            data: params,
            type: clientInfo.type
          });
          break;
          
        case 'STATUS':
          // 设备状态更新
          mainWindow.webContents.send('device-status', {
            deviceId,
            status: params,
            type: clientInfo.type
          });
          break;
          
        default:
          // 通用消息转发
          mainWindow.webContents.send('device-message', {
            deviceId,
            message,
            type: clientInfo.type
          });
      }
    });
    
    // 监听连接关闭
    socket.on('close', (hadError) => {
      clientInfo.status = 'offline';
      clients.delete(deviceId);
      console.log(`device ${deviceId} cut off (错误: ${hadError})`);
      sendDeviceList();
      console.log("$$device hang on");
    });
    
    // 监听错误
    socket.on('error', (err) => {
      console.error(`device ${deviceId} err: ${err.message}`);
      clientInfo.status = 'error';
      socket.destroy();
      sendDeviceList();
      console.log("$$device err");
      
    });
  });
  
  // 启动服务器
  server.listen(7777, () => {
    console.log('服务器已启动，监听端口 7777');
    mainWindow.webContents.send('server-status', '服务器运行中');
  });
  
  // 服务器错误处理
  server.on('error', (err) => {
    console.error('服务器错误:', err);
    mainWindow.webContents.send('server-status', `服务器错误: ${err.message}`);
  });
}

// 向特定设备发送消息
function sendToDevice(deviceId, message) {
  const client = clients.get(deviceId);
  if (client && client.status === 'online') {
    client.socket.write(`${message}\n`);
    return true;
  }
  return false;
}

// 向所有设备广播消息
function broadcast(message) {
  clients.forEach(client => {
    if (client.status === 'online') {
      client.socket.write(`${message}\n`);
    }
  });
}

// 发送设备列表到前端
function sendDeviceList() {
  const devices = Array.from(clients.values()).map(client => ({
    id: client.id,
    name: client.name,
    type: client.type,
    ip: client.ip,
    status: client.status,
    connectedAt: client.connectedAt.toLocaleString(),
    lastSeen: client.lastSeen.toLocaleString()
  }));

  for(let i = 0; i < devices.length; i++){
    for(let j = 0; j < devices.length; j++){
        if(j != i){
            if(devices[i]["name"] == devices[j]["name"]){
                devices.splice(j, 1);
            }
        }
    }
  }
  
  mainWindow.webContents.send('device-list', devices);
}

// 处理前端命令
ipcMain.on('send-to-device', (event, { deviceId, message }) => {
  const success = sendToDevice(deviceId, message);
  event.sender.send('send-status', {
    deviceId,
    success,
    message: success ? '发送成功' : '设备不在线'
  });
});

ipcMain.on('broadcast', (event, message) => {
  broadcast(message);
  event.sender.send('broadcast-status', '广播已发送');
});

app.whenReady().then(() => {
  createWindow();
  createServer();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});



app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 关闭所有连接
    clients.forEach(client => client.socket.destroy());
    server.close();
    app.quit();
  }
});

