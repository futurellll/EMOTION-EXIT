import openai
from backend.config import apikey, prompt

openai.api_key = apikey
def generate_emotion_report(emotion_log):
    response = openai.ChatCompletion.create(
        model = "gpt-4o",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    result = response.choices[0].message.content.strip()
    generated_text = result
    
    return generated_text