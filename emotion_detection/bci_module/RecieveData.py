"""Example program to show how to read a multi-channel time series from LSL."""
import time
from pylsl import StreamInlet
from pylsl.resolve import resolve_stream
import threading

emotion_matrix = {
    "Attention": 0.5,
    "Engagement": 0.5,
    "Excitement": 0.5,
    "Interest": 0.5,
    "Relaxation": 0.5,
    "Stress": 0.5
}
state_lock = threading.Lock()

def get_emotion_level():
    with state_lock:
        return emotion_matrix

def update_level(sample):
    with state_lock:
        for i, key in enumerate(emotion_matrix.keys()):
            if i < len(sample):
                emotion_matrix[key] = sample[i]  # 保留三位小数
        print("[更新] 当前情绪状态:")
        print(emotion_matrix)

def process_stream(stream_type):
    streams = resolve_stream('type', stream_type)
    if streams:
        return streams[0]
    else:
        return None


stream_type = "Performance-Metrics"
selected_stream = process_stream(stream_type)

if selected_stream:
    print(f"Selected stream: {selected_stream.name()}")
else:
    print("No matching stream found.")

inlet = StreamInlet(selected_stream)
info = inlet.info()
print(f"\nThe manufacturer is: {info.desc().child_value('manufacturer')}")
print("The channel labels are listed below:")
ch = info.desc().child("channels").child("channel")
labels = []
for _ in range(info.channel_count()):
    labels.append(ch.child_value('label'))
    ch = ch.next_sibling()
print(f"  {', '.join(labels)}") 

print("Now pulling samples...")

while True:
    sample, timestamp = inlet.pull_sample()
    if timestamp != None:
        update_level(sample)

