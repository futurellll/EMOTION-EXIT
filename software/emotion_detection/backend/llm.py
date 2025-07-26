from openai import OpenAI
from backend.config import apikey, prompt
import openai

client = OpenAI(

  base_url="https://openrouter.ai/api/v1",

  api_key= apikey,

)
def generate_emotion_report(emotion_log,success_data):
    filled_prompt = prompt.format(emotion_log=emotion_log,success_data=success_data)
    response = client.chat.completions.create(
        model = "qwen/qwen3-30b-a3b:free",
        messages=[
            {"role": "user", "content": filled_prompt}
        ]
    )

    result = response.choices[0].message.content.strip()
    
    return result