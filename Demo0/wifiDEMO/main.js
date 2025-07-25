const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const net = require('net');

let mainWindow;
let server;
let client;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
    if (server) server.close();
    if (client) client.destroy();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // 提示用户
  if (mainWindow) {
    mainWindow.webContents.send('status', '等待ESP32连接...');
  }

  // 创建TCP服务器
  createTCPServer();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

function createTCPServer() {
  server = net.createServer((socket) => {
    // 处理新连接
    client = socket;
    console.log('ESP32已连接');
    mainWindow.webContents.send('status', 'ESP32已连接');

    // 接收ESP32消息
    socket.on('data', (data) => {
      const message = data.toString('utf8');
      console.log('收到ESP32消息:', message.trim());
      mainWindow.webContents.send('message', message);
    });

    // 处理断开连接
    socket.on('end', () => {
      console.log('ESP32断开连接');
      client = null;
      mainWindow.webContents.send('status', 'ESP32断开连接');
    });

    // 处理错误
    socket.on('error', (err) => {
      console.error('Socket错误:', err);
      client = null;
    });
  });

  server.on('error', (err) => {
    console.error('服务器错误:', err);
    mainWindow.webContents.send('status', '服务器错误: ' + err.message);
  });

  // 监听端口7777
  server.listen(7777, () => {
    console.log('服务器已启动，监听端口7777');
    mainWindow.webContents.send('status', '服务器已启动，等待ESP32连接...');
  });
}

// 处理来自渲染进程的消息
ipcMain.on('send-message', (event, message) => {
  if (client && client.writable) {
    // 添加换行符并发送
    const messageWithLineEnd = message + '\n';
    client.write(messageWithLineEnd, 'utf8', (err) => {
      if (err) {
        console.error('发送失败:', err);
        mainWindow.webContents.send('send-status', '发送失败: ' + err.message);
      } else {
        console.log('发送成功:', message);
        mainWindow.webContents.send('send-status', '发送成功');
      }
    });
  } else {
    console.log('无法发送: ESP32未连接');
    mainWindow.webContents.send('send-status', '发送失败: ESP32未连接');
  }
});