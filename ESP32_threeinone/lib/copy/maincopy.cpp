#define DEVICE_SELECTOR 1

#include <WiFi.h>
#include <WiFiClient.h>
#include <string>
#include <sstream>



// WiFi配置
const char* ssid = "MAGICAL-JEJBD-con";  
const char* password = "13681644";

// 服务器配置
const char* host = "192.168.137.1";
const int port = 7777;



#if DEVICE_SELECTOR == 1
// 设备信息（唯一标识关键）
const char* deviceName = "ESP32-1";  // 设备名称

#define rppBt_1   20
#define rppTp_1   100

#define rppBt_2   20
#define rppTp_2   100

#endif

#if DEVICE_SELECTOR == 2
// 设备信息（唯一标识关键）
const char* deviceName = "ESP32-2";  // 设备名称

#define rppBt_1   0
#define rppTp_1   50

#define rppBt_2   0
#define rppTp_2   50

#endif

#if DEVICE_SELECTOR == 3
// 设备信息（唯一标识关键）
const char* deviceName = "ESP32-3";  // 设备名称

#define rppBt_1   0
#define rppTp_1   50

#define rppBt_2   0
#define rppTp_2   50

#endif

const int rpp_1[2] = {rppBt_1, rppTp_1};
const int rpp_2[2] = {rppBt_2, rppTp_2};
const int rpp_1_width = rppTp_1 - rppBt_1;
const int rpp_2_width = rppTp_2 - rppBt_2;

String macAddress;  // 存储MAC地址（作为唯一标识）

// 硬件配置
const int LED_PIN = 22;  // 板载LED引脚

// 网络客户端
WiFiClient client;

// 连接状态变量
unsigned long lastReconnectAttempt = 0;  // 重连计时器
const unsigned long RECONNECT_DELAY = 5000;  // 重连间隔（5秒）

// 连接WiFi函数（带重试机制）
void connectToWiFi() {
  Serial.print("连接WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  // 等待连接，最多重试10次
  int retryCount = 0;
  while (WiFi.status() != WL_CONNECTED && retryCount < 10) {
    delay(500);
    Serial.print(".");
    retryCount++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi连接成功");
    Serial.print("本地IP地址: ");
    Serial.println(WiFi.localIP());
    digitalWrite(LED_PIN, LOW);  // 连接成功点亮LED
    delay(500);
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.println("\nWiFi连接失败，请检查配置");
  }
}

// 连接服务器函数（返回连接状态）
bool connectToServer() {
  Serial.print("连接服务器: ");
  Serial.print(host);
  Serial.print(":");
  Serial.println(port);

  // 断开现有连接（防止重连时冲突）
  if (client.connected()) {
    client.stop();
  }

  // 尝试连接服务器
  if (client.connect(host, port)) {
    // 发送设备完整身份信息（名称+MAC，用于服务器去重）
    String identifyMsg = "IDENTIFY:";
    identifyMsg += deviceName;
    identifyMsg += ":";
    identifyMsg += macAddress;  // 关键：发送MAC地址作为唯一标识
    client.println(identifyMsg);
    Serial.println("已发送身份信息: " + identifyMsg);

    // 发送初始状态
    client.println("STATUS:READY");
    return true;
  } else {
    Serial.println("服务器连接失败");
    return false;
  }
}

// 处理服务器命令
void handleServerCommands() {
  while (client.available() > 0) {
    String command = client.readStringUntil('\n');
    command.trim();  // 移除换行符和空格

    if (command.isEmpty()) {
      return;  // 忽略空命令
    }

    Serial.print("收到服务器命令: ");
    Serial.println(command);

    // 解析命令并执行
    if (command == "LED_ON") {
      digitalWrite(LED_PIN, LOW);
      client.println("STATUS:LED_ON");  // 回复执行结果
      Serial.println("LED已开启");
    } 
    else if (command == "LED_OFF") {
      digitalWrite(LED_PIN, HIGH);
      client.println("STATUS:LED_OFF");  // 回复执行结果
      Serial.println("LED已关闭");
    } 
    else if (command == "HEARTBEAT_REQUEST") {
      // 响应服务器心跳请求（用于服务器检测在线状态）
      client.println("HEARTBEAT:ACK");
      Serial.println("已回复心跳请求");
    } 
    else if (command == "GET_STATUS") {
      // 回复当前LED状态
      String status = digitalRead(LED_PIN) ? "ON" : "OFF";
      client.println("DATA:LED=" + status);
      Serial.println("已发送状态: " + status);
    }else {
      // 其他命令回复
      String input = command;
      int numbers[2];
      int colonIndex = input.indexOf('|');
  
      if (colonIndex != -1) {
    // 提取冒号前的数字
      String part1 = input.substring(0, colonIndex);
      numbers[0] = part1.toInt();
    
    // 提取冒号后的数字
      String part2 = input.substring(colonIndex + 1);
      numbers[1] = part2.toInt();

      // Serial.print("Number 0: ");
      // Serial.println(numbers[0]);
      // Serial.print("Number 1: ");
      // Serial.println(numbers[1]);

      int pwm1 = 1023 - (rppBt_1 + rpp_1_width * numbers[0] / 100) * 1023 / 100; 
      int pwm2 = 1023 - (rppBt_2 + rpp_2_width * numbers[1] / 100) * 1023 / 100; 

      Serial.println(pwm1);
      Serial.println(pwm2);

      analogWrite(12, 1023);
      analogWrite(14, pwm1);

      analogWrite(26, 1023);
      analogWrite(27, 0);


      
      client.println("STATUS:EXTERNAL_COMMAND");
      Serial.println("收到其他命令");
    }
  }
}
}

// 发送心跳包（主动维持连接）
void sendHeartbeat() {
  if (client.connected()) {
    client.println("HEARTBEAT:ALIVE");
    // Serial.println("已发送心跳包");  // 调试用，正常可注释
  }
}

void setup() {
  // 初始化硬件
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(26, OUTPUT);
  pinMode(27, OUTPUT);
  pinMode(12, OUTPUT);
  pinMode(14, OUTPUT);

  analogWriteResolution(10);

  digitalWrite(LED_PIN, HIGH);  // 初始关闭LED

  // 获取MAC地址（唯一标识核心）
  macAddress = WiFi.macAddress();
  Serial.print("设备MAC地址: ");
  Serial.println(macAddress);

  // 连接WiFi
  connectToWiFi();

  // 初始连接服务器
  connectToServer();
}

void loop() {
  
  // 维护WiFi连接
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi已断开，尝试重连...");
    connectToWiFi();
    delay(1000);
    return;
  }

  // 维护服务器连接（断线自动重连）
  if (!client.connected()) {
    unsigned long now = millis();
    // 避免频繁重连，间隔RECONNECT_DELAY
    if (now - lastReconnectAttempt > RECONNECT_DELAY) {
      lastReconnectAttempt = now;
      Serial.println("服务器连接断开，尝试重连...");
      if (connectToServer()) {
        Serial.println("重连服务器成功");
        lastReconnectAttempt = 0;  // 重置计时器
      }
    }
    delay(100);
    return;
  }

  // 处理服务器发送的命令
  handleServerCommands();

  // 定时发送心跳（5秒一次）
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 5000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }

  delay(10);
}



