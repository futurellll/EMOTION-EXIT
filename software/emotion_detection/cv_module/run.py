# run.py
from cv_module.camera_service import start_camera_loop
import time
import threading

emotion_state = {
    "emotion": "angry",
    "timestamp": time.time()
}
state_lock = threading.Lock()

def echo(text):
    print(text)

def callback(result):
    with state_lock:
        if isinstance(result, dict):
            emotion_state["emotion"] = result.get("emotion", "neutral")
        else:
            emotion_state["emotion"] = str(result)
        emotion_state["timestamp"] = time.time()
    print(f"[更新] 当前情绪: {emotion_state['emotion']}")     

def get_emotion_type():
    with state_lock:
        return emotion_state["emotion"]

def start_cv_service():

    print("[启动] 摄像头情绪识别服务，每5秒采样一帧")
    start_camera_loop(callback, interval_sec=3)

    