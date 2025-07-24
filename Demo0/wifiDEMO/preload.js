const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 接收消息
  onStatus: (callback) => ipcRenderer.on('status', (_, status) => callback(status)),
  onMessage: (callback) => ipcRenderer.on('message', (_, message) => callback(message)),
  onSendStatus: (callback) => ipcRenderer.on('send-status', (_, status) => callback(status)),
  
  // 发送消息
  sendMessage: (message) => ipcRenderer.send('send-message', message)
});