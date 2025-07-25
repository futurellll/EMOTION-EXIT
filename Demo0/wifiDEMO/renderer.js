    document.addEventListener('DOMContentLoaded', () => {
      // 获取DOM元素
      const statusElement = document.getElementById('connection-status');
      const messagesElement = document.getElementById('messages');
      const messageInput = document.getElementById('message-input');
      const sendButton = document.getElementById('send-button');
      const sendStatusElement = document.getElementById('send-status');
      
      // 监听连接状态变化
      window.electronAPI.onStatus((status) => {
        statusElement.textContent = status;
        appendMessage(`系统: ${status}`, 'status-message');
      });
      
      // 监听收到的消息
      window.electronAPI.onMessage((message) => {
        appendMessage(`ESP32: ${message.trim()}`, 'esp32-message');
      });
      
      // 监听发送状态
      window.electronAPI.onSendStatus((status) => {
        sendStatusElement.textContent = status;
        setTimeout(() => {
          sendStatusElement.textContent = '';
        }, 3000);
      });
      
      // 发送消息
      window.sendMessage = () => {
        const message = messageInput.value.trim();
        if (message) {
          window.electronAPI.sendMessage(message);
          appendMessage(`电脑: ${message}`, 'pc-message');
          messageInput.value = '';
        }
      };
      
      // 支持按Enter键发送
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          window.sendMessage();
        }
      });
      
      // 添加消息到消息区域
      function appendMessage(text, className) {
        const messageElement = document.createElement('p');
        messageElement.textContent = text;
        messageElement.className = className;
        messagesElement.appendChild(messageElement);
        messagesElement.scrollTop = messagesElement.scrollHeight;
      }
    });