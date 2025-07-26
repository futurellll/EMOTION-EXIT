🎧 EmotionTune · 多模态情绪监测与调频系统

    EmotionTune 是一个融合脑机接口（BCI）、计算机视觉（CV）与大语言模型（LLM）的多模态情绪监测与调频系统，旨在实现对人类情绪状态的实时识别、分析与智能反馈。

🧠 项目架构概览

EmotionTune 系统由 ESP32 设备端、Python 后端服务 与 Electron 前端可视化 三大模块组成，功能贯穿 情绪数据采集 → 多模态融合分析 → 可视化与设备联动调节 全流程。
📁 目录结构

EmotionTune/
├── ESP32_threeinone/           # ESP32 端代码（PlatformIO 工程）
├── software/
│   ├── emotion_detection/      # 后端服务
│   │   ├── backend/            # FastAPI + LLM 服务接口
│   │   ├── bci_module/         # 脑机接口数据处理模块
│   │   └── cv_module/          # 视觉情绪识别模块
│   └── frontend/               # Electron 前端界面
│       ├── html/               # 备用页面（静态备份）
│       ├── img/                # 图片资源
│       ├── Js/                 # 可视化脚本（如波形图）
│       └── index.html          # 前端主页面

✨ 核心功能

    🎛 脑机接口采集：使用 ESP32 与 Python 后端通信，实现脑电数据实时上传。

    🧠 多模态情绪识别：融合脑电（BCI）与视觉（CV）特征，输出情绪类型与强度。

    📊 前端实时可视化：Electron 前端实时展示多通道脑电波形、情绪状态与设备状态。

    🔁 设备调频反馈：支持通过前端发送指令控制 ESP32 设备，实现情绪调节反馈。

🚀 快速开始
1️⃣ 部署 ESP32

    安装 PlatformIO

    打开 ESP32_threeinone/ 工程

    修改 WiFi 账号与服务器地址

    编译并烧录至 ESP32 板

2️⃣ 启动后端服务

cd software/emotion_detection
pip install -r requirements.txt
python backend/server.py

3️⃣ 启动前端可视化

cd software/frontend
npm install
npm start

📌 关键文件说明
文件路径	说明
ESP32_threeinone/src/main.cpp	ESP32 主控代码，处理数据采集与服务器通信
emotion_detection/backend/server.py	FastAPI 服务入口，提供情绪识别与分析 API
emotion_detection/bci_module/RecieveData.py	读取并处理脑机接口数据
frontend/main.js	Electron 主进程，处理 TCP 通信与前后端交互
frontend/Js/wave.js	前端波形图与情绪数据渲染逻辑
frontend/index.html	主 UI 页面，集成可视化界面与设备控制模块
📦 依赖环境
模块	环境要求
ESP32	PlatformIO
后端	Python 3.8+，FastAPI，TensorFlow / Keras / NumPy 等
前端	Node.js，Electron，TailwindCSS，jQuery
🤝 反馈与贡献

欢迎提交 Issue 或发起 Pull Request 一起优化本项目！
💡 未来展望

    多设备情绪同步与联动

    更丰富的 LLM 驱动情绪解释与干预建议

    移动端小程序或 WebApp 化

