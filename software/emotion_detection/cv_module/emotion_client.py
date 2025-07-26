# emotion_client.py
import cv2
import numpy as np
from deepface import DeepFace

class EmotionClient:
    def __init__(self, threshold=0.5):
        self.threshold = threshold  # 最小置信度
        self.last_emotion = None    # 可用于平滑

    def predict(self, frame: np.ndarray) -> dict:
        # DeepFace 默认输入 BGR，所以可以直接用 OpenCV 的 frame
        try:
            result = DeepFace.analyze(
                frame,
                actions=['emotion'],
                enforce_detection=False
            )
            emotions = result[0]['emotion']
            dominant_emotion = result[0]['dominant_emotion']
            confidence = emotions[dominant_emotion] / 100.0  # 百分比转小数

            if confidence < self.threshold:
                # 如果低于阈值，可选择输出中性或保留上一次
                emotion = "neutral"
            else:
                emotion = dominant_emotion

            self.last_emotion = emotion
            return {
                "emotion": emotion,
                "score": round(confidence, 4)
            }
        except Exception as e:
            print("[EmotionClient] Error:", e)
            return {
                "emotion": self.last_emotion or "neutral",
                "score": 0.0
            }

