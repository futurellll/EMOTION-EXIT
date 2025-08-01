#define DEVICE_SELECTOR 2

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
const int BREATH_LED_PIN = 23;  // 呼吸灯引脚

// 呼吸灯控制变量
unsigned long breathLastUpdate = 0;
float breathPhase = 0.0;  // 使用相位控制，0.0到2π
float currentFrequency = 1.0;  // 当前频率（Hz），默认1Hz
const float MIN_FREQ = 0.1;    // 最小频率0.3Hz
const float MAX_FREQ = 1.0;    // 最大频率2Hz
const int MIN_BRIGHTNESS = 0;
const int MAX_BRIGHTNESS = 1023;
const int BASE_UPDATE_STEPS = 100;  // 基础更新步数，确保平滑度
float phaseIncrement = 0.0;         // 相位增量，动态计算

// 网络客户端
WiFiClient client;

// 连接状态变量
unsigned long lastReconnectAttempt = 0;  // 重连计时器
const unsigned long RECONNECT_DELAY = 5000;  // 重连间隔（5秒）

// 调整呼吸灯频率（参数0-100映射到0.3-2Hz）
void setBreathFrequency(int percent) {
  // 限制输入参数范围
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;
  
  // 将0-100映射到0.3-2Hz，使用指数映射增强低百分比时的频率差异
  float normalized = percent / 100.0;
  // 指数映射让低数值时有更明显的变化
  currentFrequency = MIN_FREQ + (MAX_FREQ - MIN_FREQ) * (1 - exp(-3 * normalized));
  
  // 计算相位增量，确保每个频率下都有足够的更新步数
  phaseIncrement = (2 * PI * currentFrequency) / (1000.0 / 10);  // 每10ms的相位增量
}

// 更新呼吸灯状态（非阻塞）
void updateBreathLED() {
  if (currentFrequency <= 0) {
    analogWrite(BREATH_LED_PIN, 0);  // 频率为0时关闭
    return;
  }

  // 固定10ms更新间隔，确保足够的平滑度
  const unsigned long updateInterval = 10;
  
  unsigned long now = millis();
  if (now - breathLastUpdate >= updateInterval) {
    breathLastUpdate = now;
    
    // 更新相位（0到2π循环）
    breathPhase += phaseIncrement;
    if (breathPhase >= 2 * PI) {
      breathPhase -= 2 * PI;
    }
    
    // 使用改进的平滑呼吸曲线：正弦曲线的平方，使变化更自然
    // 曲线在中间区域变化更平缓，两端变化稍快，减少视觉闪烁
    float brightnessFactor = sin(breathPhase - PI/2) + 1;  // 范围0到2
    brightnessFactor = brightnessFactor * brightnessFactor / 4;  // 平方后归一化到0到1
    
    int brightness = brightnessFactor * MAX_BRIGHTNESS;
    
    // 限制亮度范围（安全措施）
    if (brightness < MIN_BRIGHTNESS) brightness = MIN_BRIGHTNESS;
    if (brightness > MAX_BRIGHTNESS) brightness = MAX_BRIGHTNESS;
    
    // 设置PWM输出
    analogWrite(BREATH_LED_PIN, brightness);
  }
}

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
    }
    // 呼吸灯频率控制命令
    else if (command.startsWith("BREATH_FREQ:")) {
      int percent = command.substring(11).toInt();
      setBreathFrequency(percent);
      client.println("STATUS:BREATH_FREQ=" + String(currentFrequency, 2) + "Hz");
      Serial.print("呼吸灯频率已设置为: ");
      Serial.print(currentFrequency, 2);
      Serial.println("Hz");
    }
    else {
      // 其他命令处理
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
  }
}

void setup() {
  // 初始化硬件
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BREATH_LED_PIN, OUTPUT);  // 初始化呼吸灯引脚
  pinMode(26, OUTPUT);
  pinMode(27, OUTPUT);
  pinMode(12, OUTPUT);
  pinMode(14, OUTPUT);

  analogWriteResolution(10);  // 设置PWM分辨率为10位（0-1023）
  //analogWriteFreq(5000);      // 设置PWM频率为5kHz，减少可能的闪烁

  digitalWrite(LED_PIN, HIGH);  // 初始关闭LED
  analogWrite(BREATH_LED_PIN, 0);  // 初始关闭呼吸灯

  // 获取MAC地址（唯一标识核心）
  macAddress = WiFi.macAddress();
  Serial.print("设备MAC地址: ");
  Serial.println(macAddress);

  // 初始化呼吸频率
  setBreathFrequency(50);  // 默认50%对应约1Hz

  // 连接WiFi
  connectToWiFi();

  // 初始连接服务器
  connectToServer();

  setBreathFrequency(1);
}

void loop() {
  // 更新呼吸灯状态（非阻塞）
  updateBreathLED();
  
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
    delay(10);
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

  delay(1);  // 微小延迟，降低CPU占用
}
