# EmotionTune 多模态情绪监测与调频系统

## 项目简介

EmotionTune 是一个基于多模态数据（脑机接口、计算机视觉、情绪识别）实现的情绪监测与调频系统。系统包含 ESP32 硬件端、Python 后端服务、Electron 前端可视化三大部分，实现了情绪数据的采集、分析、可视化与设备联动。

---

## 目录结构
ESP32_threeinone/ # ESP32 设备端代码（PlatformIO 工程） software/ emotion_detection/ # Python 后端（情绪识别、数据处理、API 服务） backend/ # FastAPI 服务、LLM、配置 bci_module/ # 脑机接口数据采集与处理 cv_module/ # 视觉情绪识别 frontend/ # Electron 前端（数据可视化、设备管理） html/ # 备份的前端页面 img/ # 图片资源 Js/ # 前端 JS 脚本

## 主要功能

- **脑机接口数据采集**：通过 ESP32 设备与 Python 后端采集脑波等数据。
- **情绪识别与分析**：后端融合脑波、视觉等多模态数据，输出情绪类型与强度。
- **前端可视化**：Electron 前端实时展示多通道波形、情绪类型、强度、设备状态等。
- **设备联动**：支持通过前端控制 ESP32 设备，实现调频等功能。

---

## 快速开始

### 1. ESP32 端

- 使用 [PlatformIO](https://platformio.org/) 打开 `ESP32_threeinone` 目录，配置 WiFi 和服务器地址，编译并烧录到 ESP32。

### 2. 后端服务

```bash
cd software/emotion_detection
pip install -r requirements.txt
python [server.py](http://_vscodecontentref_/0)

3. 前端可视化

cd software/frontend
npm install
npm start

主要文件说明
ESP32_threeinone/src/main.cpp
ESP32 主控代码，负责与服务器通信、执行调频命令等。

software/emotion_detection/backend/server.py
FastAPI 服务，聚合多模态情绪数据并提供接口。

software/emotion_detection/bci_module/RecieveData.py
脑机接口数据采集与处理。

software/frontend/main.js
Electron 主进程，负责 TCP 服务器、设备管理、前后端通信。

software/frontend/Js/wave.js
前端波形图、情绪强度等数据可视化逻辑。

software/frontend/index.html
主界面页面，集成设备管理、情绪监测、波形显示等模块。

依赖环境
ESP32: PlatformIO
后端: Python 3.8+、FastAPI、相关深度学习/信号处理库
前端: Node.js、Electron、TailwindCSS、jQuery

后端启动
python main.py

联系与贡献
如需反馈问题或贡献代码，请提交 Issue 或 Pull Request。

