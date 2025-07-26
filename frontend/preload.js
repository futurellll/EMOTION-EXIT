const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 接收消息
  onServerStatus: (callback) => ipcRenderer.on('server-status', (_, status) => callback(status)),
  onDeviceList: (callback) => ipcRenderer.on('device-list', (_, devices) => callback(devices)),
  onDeviceData: (callback) => ipcRenderer.on('device-data', (_, data) => callback(data)),
  onDeviceStatus: (callback) => ipcRenderer.on('device-status', (_, status) => callback(status)),
  onDeviceMessage: (callback) => ipcRenderer.on('device-message', (_, message) => callback(message)),
  onSendStatus: (callback) => ipcRenderer.on('send-status', (_, status) => callback(status)),
  
  // 发送消息
  sendToDevice: (deviceId, message) => ipcRenderer.send('send-to-device', { deviceId, message }),
  broadcast: (message) => ipcRenderer.send('broadcast', message)
});