from fastapi import FastAPI
from bci_module.RecieveData import get_emotion_level
from cv_module.run import get_emotion_type
from datetime import datetime, timedelta
from backend.llm import generate_emotion_report

app = FastAPI()

# ====== 测试会话缓存 ======
test_active = False
test_start_time = None
test_data_log = []
test_success = False
test_done = False
generated_text = ""

def data_process(emotion_level, emotion_type='neutral'):
    """
    计算情绪强度，用于脑控反馈。
    输入：
        - emotion_level: dict，包含 Attention, Engagement, Excitement, Interest, Relaxation, Stress
        - emotion_type: str，来自 DeepFace，如 'happy', 'angry', 'fear', 'neutral'
    输出：
        - intensity: float ∈ [0, 1]，表示“能力强度”
    """

    weights = {
        "Attention": 1.0,
        "Engagement": 0.8,
        "Excitement": 0.6,
        "Interest": 0.5,
        "Relaxation": -1.0,
        "Stress": -1.2
    }

    # 默认值防止缺失
    attention = emotion_level.get("Attention", 0.5)
    engagement = emotion_level.get("Engagement", 0.5)
    relaxation = emotion_level.get("Relaxation", 0.5)
    stress = emotion_level.get("Stress", 0.5)

    # Step 1: 合理状态（专注 + 非紧张）
    in_valid_range = (
        (attention >= 0.6 or engagement >= 0.6) and
        (0.2 <= relaxation <= 0.85) and
        (0.2 <= stress <= 0.75)
    )

    # Step 2: 仅在非 neutral / fear 情绪下激活
    emotional_active = emotion_type.lower() not in ['neutral', 'fear']

    if in_valid_range and emotional_active:
        # Step 3: 计算激活强度
        raw_score = sum(
            emotion_level.get(k, 0.5) * weights.get(k, 0)
            for k in weights
        )

        # 归一化范围调宽，容许强者更强
        min_val, max_val = -2.0, 3.5
        norm_score = (raw_score - min_val) / (max_val - min_val)
        norm_score = max(0.0, min(1.0, norm_score))

        # Step 4: 基于情绪种类调整权重
        emotion_boost = {
            'happy': 1.15,
            'angry': 1.25,
            'surprise': 1.1,
            'sad': 0.9,
            'disgust': 1.05,
            'fear': 0.5,
            'neutral': 0.3
        }
        boost = emotion_boost.get(emotion_type.lower(), 1.0)

        intensity = norm_score * boost
        return round(min(intensity, 1.0), 3)

    return 0.0


@app.get('/ping')
async def ping():
    global test_active, test_start_time, test_data_log, test_success, test_done, generated_text
    test_active = True
    test_start_time = datetime.now()
    test_data_log = []
    test_success = False
    test_done = False
    generated_text = ""
    return {"status": "reset"}


@app.get("/emotion/bci")
async def get_bci():
    return get_emotion_level()


@app.get("/emotion/cv")
async def get_cv():
    return {"emotion": get_emotion_type()}

@app.get("/emotion/intensity")
async def get_emotion():
    global test_active, test_start_time, test_data_log, test_success, test_done

    emotion_level = get_emotion_level()
    emotion_type = get_emotion_type()
    intensity = data_process(emotion_level, emotion_type)

    if test_active:
        now = datetime.now()
        test_data_log.append({
            "time": now.strftime("%H:%M:%S"),
            "bci": emotion_level,
            "cv": emotion_type,
            "intensity": intensity
        })

        if intensity >= 0.85:
            test_success = True
            test_active = False
        elif now - test_start_time > timedelta(minutes=2):
            test_success = False
            test_active = False

    return {
        "intensity": intensity,
        "success": test_success,
        "done": not test_active and test_success and not test_done
    }





@app.get("/text")
async def get_text():
    global test_data_log, generated_text, test_done

    if generated_text:
        return {"text": generated_text}

    # 构造 prompt
    log_summary = "\n".join([
        f"[{item['time']}] Intensity: {item['intensity']}, CV: {item['cv']}, BCI: {item['bci']}"
        for item in test_data_log
    ])

    text = generate_emotion_report(log_summary)
    test_done = True

    return {"text": text}



def push_intensity():
    # 从两个模块获取愤怒程度（0~1）
    emotion_level = get_emotion_level()
    emotion_type = get_emotion_type()

    intensity = data_process(emotion_level, emotion_type)

    return {"intensity": intensity}

