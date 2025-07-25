import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk
import requests
import io
import cv2
import json
import threading
import time
import numpy as np

# Server URLs Configuration
REALTIME_ANALYSIS_URL = 'http://localhost:5000/analyze_online'

# -------------------- Real-Time Analysis Functionality --------------------
class RealTimeAnalysis:
    def __init__(self, master=None):
        self.stop_event = threading.Event()
        self.thread = None
        self.master = master
        self.control_window = None

    def start(self):
        if self.thread and self.thread.is_alive():
            messagebox.showinfo("Real-Time Analysis", "Real-time analysis is already running.")
            return
        self.stop_event.clear()
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()
        self.create_control_window()
        messagebox.showinfo("Real-Time Analysis", "Real-time analysis started.")

    def create_control_window(self):
        self.control_window = tk.Toplevel(self.master)
        self.control_window.title("Real-Time Analysis Control")
        self.control_window.geometry("300x100")

        # Use ttk style
        self.style = ttk.Style(self.control_window)
        self.style.theme_use('clam')  # 可选其他主题

        # Exit Button
        exit_button = ttk.Button(self.control_window, text="Exit", command=self.stop)
        exit_button.pack(pady=20)

        # Handle window closing
        self.control_window.protocol("WM_DELETE_WINDOW", self.stop)

    def run(self):
        # Configuration
        SERVER_URL = REALTIME_ANALYSIS_URL
        SEND_INTERVAL = 0.05  # Frame send interval in seconds (e.g., 20 FPS)
        DISPLAY_WINDOW_NAME = 'Original and Processed Video'  # Display window name
        FRAME_RESIZE_WIDTH = 640        # Width of frame sent to server
        FRAME_RESIZE_HEIGHT = 480       # Height of frame sent to server

        latest_frame = None
        latest_frame_lock = threading.Lock()
        processed_frame = None
        processed_frame_lock = threading.Lock()

        def send_frame_to_server():
            nonlocal latest_frame, processed_frame
            session = requests.Session()  # Use session to reuse connections
            while not self.stop_event.is_set():
                frame_to_send = None
                with latest_frame_lock:
                    if latest_frame is not None:
                        frame_to_send = latest_frame.copy()

                if frame_to_send is not None:
                    try:
                        # Resize frame
                        resized_frame = cv2.resize(frame_to_send, (FRAME_RESIZE_WIDTH, FRAME_RESIZE_HEIGHT))
                        # Encode frame as JPEG
                        _, img_encoded = cv2.imencode('.jpg', resized_frame)
                        # Send POST request
                        response = session.post(
                            SERVER_URL,
                            files={'frame': img_encoded.tobytes()},
                            timeout=5
                        )
                        response.raise_for_status()  # HTTP errors

                        result = response.json()

                        # Annotate frame
                        annotated_frame = frame_to_send.copy()
                        for annotation in result.get('annotations', []):
                            bbox = annotation.get('bbox', [])
                            label = annotation.get('label', '')
                            dominant_emotion = annotation.get('dominant_emotion', '')
                            emotions = annotation.get('emotions', {})

                            if len(bbox) == 4:
                                x, y, w, h = bbox
                                # Draw bounding box
                                cv2.rectangle(annotated_frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

                                # 显示标签（如需要）
                                if label:
                                    cv2.putText(annotated_frame, label, (x, y - 10),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2)

                                # 显示dominant emotion在框上方
                                if dominant_emotion:
                                    cv2.putText(annotated_frame, dominant_emotion, (x, y - 30),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2)

                                # 显示详细的情绪分布在框下方
                                offset = 0
                                sorted_emotions = sorted(emotions.items(), key=lambda item: item[1], reverse=True)
                                for emo, score in sorted_emotions:
                                    cv2.putText(annotated_frame, f"{emo}: {score:.2f}", (x, y + h + 20 + offset),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (36, 255, 12), 1)
                                    offset += 20

                        with processed_frame_lock:
                            processed_frame = annotated_frame

                    except requests.exceptions.RequestException as e:
                        print(f"Error sending frame to server: {e}")
                    except json.JSONDecodeError:
                        print("Error decoding server response as JSON.")

                # Control send interval
                time.sleep(SEND_INTERVAL)

        def capture_frames():
            nonlocal latest_frame, processed_frame
            cap = cv2.VideoCapture(0)

            if not cap.isOpened():
                print("Error: Unable to open camera.")
                messagebox.showerror("Real-Time Analysis", "Unable to open camera.")
                self.stop()
                return

            sender_thread = threading.Thread(target=send_frame_to_server, daemon=True)
            sender_thread.start()

            while not self.stop_event.is_set():
                ret, frame = cap.read()
                if not ret:
                    print("Error: Unable to read frame from camera.")
                    break

                # Update latest frame
                with latest_frame_lock:
                    latest_frame = frame.copy()

                # Prepare display
                with processed_frame_lock:
                    if processed_frame is not None:
                        height = min(frame.shape[0], processed_frame.shape[0])
                        width = min(frame.shape[1], processed_frame.shape[1])

                        original_resized = cv2.resize(frame, (width, height))
                        processed_resized = cv2.resize(processed_frame, (width, height))

                        combined_frame = np.hstack((original_resized, processed_resized))
                    else:
                        combined_frame = frame.copy()

                cv2.imshow(DISPLAY_WINDOW_NAME, combined_frame)

                if cv2.waitKey(1) & 0xFF == ord('q'):
                    self.stop()
                    break

            cap.release()
            cv2.destroyAllWindows()

        capture_frames()

    def stop(self):
        self.stop_event.set()
        if self.control_window:
            self.control_window.destroy()
        messagebox.showinfo("Real-Time Analysis", "Real-time analysis stopped.")

# -------------------- Main Application --------------------
class Application(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('File Upload and Analysis Tool')
        self.geometry('500x300')

        # Use ttk style
        self.style = ttk.Style(self)
        self.style.theme_use('clam')  # You can choose other themes

        # Main Frame
        main_frame = ttk.Frame(self, padding="20")
        main_frame.pack(expand=True, fill='both')


        # Real-Time Analysis Button
        realtime_button = ttk.Button(main_frame, text="Real-Time Analysis", width=30, command=self.start_realtime_analysis)
        realtime_button.pack(pady=10)

        # Exit Button
        exit_button = ttk.Button(main_frame, text="Exit", width=30, command=self.quit)
        exit_button.pack(pady=10)

        # Real-Time Analysis Instance
        self.realtime_analysis = RealTimeAnalysis(self)


    def start_realtime_analysis(self):
        self.realtime_analysis.start()

# -------------------- Run Application --------------------
if __name__ == '__main__':
    app = Application()
    app.mainloop()