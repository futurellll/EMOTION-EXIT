#include <WiFi.h>
#include <WiFiClient.h>

// WiFi配置
const char* ssid = "MAGICAL-JEJBD-con";
const char* password = "13681644";

// 服务器(电脑)配置
const char* host = "192.168.137.1";  // 电脑在热点网络中的IP
const int port = 7777;              // 通信端口

WiFiClient client;
const int LED_PIN = 2;  // 板载LED引脚

void connectToServer() {
  Serial.print("Connecting to server...");
  if (client.connect(host, port)) {
    Serial.println("Connected");
    client.println("ESP32 CONNECTED\n");
  } else {
    Serial.println("Connection failed");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  
  // 连接WiFi
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  
  // 连接服务器
  connectToServer();
}

void loop() {
  // 检查WiFi连接
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected");
    WiFi.reconnect();
    delay(2000);
    return;
  }
  
  // 检查TCP连接
  if (!client.connected()) {
    Serial.println("Server disconnected");
    connectToServer();
    delay(2000);
    return;
  }

    // 处理命令
  if (client.available()) {
    String line = client.readStringUntil('\n');
    line.trim();
    
    // 使用indexOf()进行部分匹配（更宽松）
    if (line.indexOf("LED_ON") != -1) {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("执行: LED_ON");
    } else if (line.indexOf("LED_OFF") != -1) {
      digitalWrite(LED_PIN, LOW);
      Serial.println("执行: LED_OFF");
    }
  }
  
  // 每5秒发送状态
  static unsigned long lastSendTime = 0;
  if (millis() - lastSendTime > 5000) {
    client.println("ESP32 STATUS: OK\n");
    lastSendTime = millis();
  }
  
  delay(10);
}

