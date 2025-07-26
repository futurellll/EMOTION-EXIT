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
  broadcast: (message) => ipcRenderer.send('broadcast', message),


    fetch: async (url, options) => {
    try {
      const response = await fetch(url, options);
      // 将响应转换为普通对象（包含 status、ok、body 等）
      return {
        status: response.status,
        ok: response.ok,
        body: await response.json() // 提前解析 JSON 避免跨进程序列化问题
      };
    } catch (error) {
      // 捕获网络错误并返回错误信息
      return { error: error.message };
    }
  }

});

contextBridge.exposeInMainWorld('waveAPI', {
  onDeviceList: (callback) => ipcRenderer.on('device-list', (_, devices) => callback(devices)),
});

