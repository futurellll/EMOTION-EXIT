# emotion_detection/backend/main.py
import threading
import time
import uvicorn
from backend.server import app
from bci_module.SendMarker import start_lsl
from bci_module.RecieveData import start_recieve_data
from cv_module.run import start_cv_service

def run_lsl():
    print("[LSL] 启动标记发送线程")
    start_lsl()

def run_recieve():
    print("[BCI] 启动脑机数据监听线程")
    start_recieve_data()

def run_api():
    print("[API] 启动 FastAPI 接口服务")
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    print("[Main] 启动后台服务...")

    # 启动两个线程
    threading.Thread(target=run_lsl, daemon=True).start()
    threading.Thread(target=run_recieve, daemon=True).start()
    threading.Thread(target=start_cv_service, daemon=True).start()
    # 启动 FastAPI 服务
    threading.Thread(target=run_api, daemon=True).start()
    

    try:
        # 主线程空转，避免退出
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("[Main] 退出中...")
