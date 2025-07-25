from fastapi import FastAPI
from bci_module.RecieveData import get_emotion_level
from cv_module.run import get_emotion_type

app = FastAPI()

def data_process(emotion_level, emotion_type='neutral'):
    # 原始权重（不归一）
    weights = {
        "Attention": 1.0,
        "Engagement": 1.0,
        "Excitement": 0.6,
        "Interest": 0.6,
        "Relaxation": -2.0,
        "Stress": -2.0
    }

    attention = emotion_level.get("Attention", 0.5)
    engagement = emotion_level.get("Engagement", 0.5)
    relaxation = emotion_level.get("Relaxation", 0.5)
    stress = emotion_level.get("Stress", 0.5)

    # Step 1: 合理状态判定
    in_valid_range = (
        (attention >= 0.6 or engagement >= 0.6) and
        (0.25 <= relaxation <= 0.85) and
        (0.35 <= stress <= 0.75)
    )

    if in_valid_range and emotion_type.lower() != 'neutral':
        # Step 2: 加权和
        raw_score = sum(
            emotion_level.get(k, 0) * weights.get(k, 0)
            for k in weights
        )

        # Step 3: 归一化（假设 raw_score ∈ [-2, 4]）
        min_val, max_val = -2.0, 4.0
        norm_score = (raw_score - min_val) / (max_val - min_val)
        norm_score = max(0.0, min(1.0, norm_score))  # clip

        # Step 4: 压制机制
        suppression_factor = (1 - relaxation) * stress
        intensity = norm_score * suppression_factor

        # Step 5: 根据 emotion_type 增强愤怒识别
        if emotion_type.lower() == 'angry':
            intensity *= 1.2  # 增强怒意强度
        elif emotion_type.lower() in ['disgust', 'fear']:
            intensity *= 1.05  # 轻微增强

        # clip 最终结果
        return round(min(intensity, 1.0), 3)

    # 不满足条件直接返回 0 强度
    return 0.0


@app.get('/ping')
async def ping():
    return 'kpong'

@app.get("/emotion/bci")
async def get_bci():
    return get_emotion_level()


@app.get("/emotion/cv")
async def get_cv():
    return {"emotion": get_emotion_type()}


@app.get("/emotion/full")
async def get_full_emotion_data():
    emotion_level = get_emotion_level()
    emotion_type = get_emotion_type()
    intensity = data_process(emotion_level, emotion_type)

    return {
        "bci": emotion_level,
        "cv": emotion_type,
        "intensity": intensity
    }

def push_intensity():
    # 从两个模块获取愤怒程度（0~1）
    emotion_level = get_emotion_level()
    emotion_type = get_emotion_type()

    # 简单融合策略：平均
    intensity = data_process(emotion_level, emotion_type)

    return {"intensity": intensity}

