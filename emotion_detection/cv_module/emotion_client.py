# emotion_client.py
import os
import cv2
import numpy as np
from keras.models import Sequential, load_model

LABELS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "model", "best_model_CNN_RGB_size96.h5")

class EmotionClient:
    def __init__(self):
        self.model = load_model(WEIGHTS_PATH)

    def predict(self, frame: np.ndarray) -> dict:
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_rgb, (96, 96))
        img_input = np.expand_dims(img_resized, axis=0) / 255.0  # 归一化

        preds = self.model(img_input, training=False).numpy()[0]
        emotion_idx = np.argmax(preds)
        return {
            "emotion": LABELS[emotion_idx],
            "score": float(preds[emotion_idx])
        }
