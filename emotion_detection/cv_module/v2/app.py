from test import analyze_image, analyze_video, analyze_online
from flask import Flask, request, jsonify, send_from_directory, send_file
from werkzeug.utils import secure_filename
import os
import uuid

app = Flask(__name__)

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

# -------------------- 实时分析功能 --------------------
@app.route('/analyze_online', methods=['POST'])
def analyze_online_route():
    if 'frame' not in request.files:
        return jsonify({"error": "No frame provided"}), 400
    file = request.files['frame'].read()
    
    try:
        annotations = analyze_online(file)
        return jsonify(annotations)  # 在这里使用 jsonify
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- IP和端口 --------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)