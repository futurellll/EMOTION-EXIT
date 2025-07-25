# camera_service.py
import time
import cv2
from emotion_client import EmotionClient

def start_camera_loop(callback, interval_sec=5):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print('无法打开摄像头')
        exit()

    model = EmotionClient()

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("[ERROR] 摄像头读取失败")
                break

            result = model.predict(frame)
            print("[Result]", result)
            callback(result)

            time.sleep(interval_sec)
    except KeyboardInterrupt:
        print("\n[INFO] 停止摄像头服务")
    finally:
        cap.release()
        cv2.destroyAllWindows()
