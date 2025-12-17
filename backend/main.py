# DOBI Detection Backend
# Run with: python main.py

import sys
import cv2
import numpy as np
from ultralytics import YOLO
from PyQt6.QtWidgets import (
    QApplication, QLabel, QWidget, QVBoxLayout, QTextEdit, QSizePolicy,
    QPushButton, QGridLayout, QGroupBox
)
from PyQt6.QtGui import QImage, QPixmap
from PyQt6.QtCore import QTimer, Qt
from threading import Thread, Lock
import requests


class DetectionEngine:
    IOU_THRESHOLD = 0.05  # PPE overlap threshold

    def __init__(self, model_path: str, device='cpu'):
        print(f"Loading YOLO model from {model_path} on device: {device} ...")
        self.model = YOLO(model_path)
        self.device = device
        self.model.model.to(device)
        print(f"YOLO model loaded from {model_path} on {device}")

        self.conf_thresholds = {
            "person": 0.46,
            "hardhat": 0.50,
            "safety_boots": 0.48,
            "safety_gloves": 0.48,
            "safety_mask": 0.70,
            "safety_vest": 0.58,
            "gas": 0.82,
            "leak": 0.80,
            "crack": 0.76,
            "damage": 0.67,
            "api": 0.20,
            "asap": 0.70
        }
        self.ppe_classes = [
            "hardhat", "safety_boots", "safety_gloves", "safety_mask", "safety_vest"
        ]

    def process_frame(self, frame):
        results = self.model(frame, stream=False, verbose=False)
        annotated_frame = frame.copy()

        detections, persons, ppe_detections = [], [], []

        names = results[0].names
        boxes = results[0].boxes

        for box in boxes:
            cls_id = int(box.cls)
            name = names[cls_id].lower()
            conf = float(box.conf[0])
            threshold = self.conf_thresholds.get(name, 0.5)
            if conf < threshold:
                continue

            display_name = {
                "api": "FIRE",
                "asap": "SMOKE"
            }.get(name, name.upper())

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            detection = {
                "name": display_name,
                "raw_name": name,
                "conf": conf,
                "box": (x1, y1, x2, y2),
                "severity": "NONE"
            }
            detections.append(detection)

            if name == "person":
                detection["ppe_status"] = "UNSAFE"
                persons.append(detection)
            elif name in self.ppe_classes:
                ppe_detections.append(detection)

        for person in persons:
            overlaps = sum(
                1 for ppe in ppe_detections
                if self.compute_iou(person["box"], ppe["box"]) >= self.IOU_THRESHOLD
            )

            if overlaps >= 5:
                person["ppe_status"] = "FULLY_PROTECTED"
            elif overlaps >= 2:
                person["ppe_status"] = "SAFE"
            else:
                person["ppe_status"] = "UNSAFE"

            x1, y1, _, _ = person["box"]
            cv2.putText(annotated_frame, f"Overlaps: {overlaps}",
                        (x1, y1 - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

        for det in detections:
            x1, y1, x2, y2 = det["box"]
            label = f"{det['name']} {det['conf']:.2f}"

            if det.get("raw_name") == "person":
                label += f" ({det['ppe_status']})"
                color = (0, 255, 0) if det["ppe_status"] in ["SAFE", "FULLY_PROTECTED"] else (0, 0, 255)
            else:
                color = (0, 0, 255) if det["severity"] != "NONE" else (0, 255, 0)

            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(annotated_frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        return detections, annotated_frame

    @staticmethod
    def compute_iou(boxA, boxB):
        expand = 5
        boxB = (boxB[0] - expand, boxB[1] - expand, boxB[2] + expand, boxB[3] + expand)

        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        inter = max(0, xB - xA + 1) * max(0, yB - yA + 1)
        boxA_area = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
        boxB_area = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)

        return inter / float(boxA_area + boxB_area - inter + 1e-6)


class DetectionApp(QWidget):
    def __init__(self, model_path, stream_url, pi_ip, device='cpu'):
        super().__init__()
        self.setWindowTitle("DOBI Detection UI + Web Motor Control")
        self.resize(1280, 720)

        self.detection_engine = DetectionEngine(model_path, device)
        self.stream_url = stream_url
        self.pi_ip = pi_ip

        self.video_label = QLabel()
        self.video_label.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.video_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.video_label.setMinimumSize(640, 360)

        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setFixedHeight(120)

        self.control_group = QGroupBox("Motor Control (via Pi Web Server)")
        self.control_layout = QGridLayout()

        self.commands = {
            "Forward": "/move/forward",
            "Backward": "/move/backward",
            "Left": "/move/left",
            "Right": "/move/right",
            "Stop": "/move/stop"
        }

        row, col = 0, 0
        for label, endpoint in self.commands.items():
            btn = QPushButton(label)
            btn.clicked.connect(lambda _, ep=endpoint: self.send_motor_command(ep))
            self.control_layout.addWidget(btn, row, col)
            col += 1
            if col > 2:
                col = 0
                row += 1
        self.control_group.setLayout(self.control_layout)

        main_layout = QVBoxLayout()
        main_layout.addWidget(self.video_label)
        main_layout.addWidget(self.log_text)
        main_layout.addWidget(self.control_group)
        self.setLayout(main_layout)

        self.cap = cv2.VideoCapture(self.stream_url)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        self.frame = None
        self.lock = Lock()
        self.running = True

        self.thread = Thread(target=self.grab_frames, daemon=True)
        self.thread.start()

        self.timer = QTimer()
        self.timer.timeout.connect(self.update_frame)
        self.timer.start(30)

        self.last_annotated = None
        self.last_detections = []

        self.setFocusPolicy(Qt.FocusPolicy.StrongFocus)

    def grab_frames(self):
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                continue
            with self.lock:
                self.frame = frame

    def update_frame(self):
        with self.lock:
            if self.frame is None:
                return
            frame = self.frame.copy()

        detections, annotated = self.detection_engine.process_frame(frame)
        self.last_annotated = annotated
        self.last_detections = detections

        self.display_image(annotated)
        self.update_log(detections)

    def display_image(self, cv_img):
        rgb_image = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb_image.shape
        bytes_per_line = ch * w
        qt_image = QImage(rgb_image.data, w, h, bytes_per_line, QImage.Format.Format_RGB888)
        pixmap = QPixmap.fromImage(qt_image).scaled(
            self.video_label.width(),
            self.video_label.height(),
            Qt.AspectRatioMode.KeepAspectRatio,
            Qt.TransformationMode.SmoothTransformation
        )
        self.video_label.setPixmap(pixmap)

    def update_log(self, detections):
        self.log_text.clear()
        for det in detections:
            self.log_text.append(f"{det['name']} ({det['conf']:.2f}) Severity: {det['severity']}")

    def send_motor_command(self, endpoint):
        url = f"http://{self.pi_ip}:5000{endpoint}"
        try:
            response = requests.get(url, timeout=1)
            if response.status_code == 200:
                self.log_text.append(f"Motor command sent: {endpoint.split('/')[-1].capitalize()}")
            else:
                self.log_text.append(f"Error sending motor command: {response.status_code}")
        except Exception as e:
            self.log_text.append(f"Exception sending motor command: {e}")

    def keyPressEvent(self, event):
        key = event.key()
        if key == Qt.Key.Key_W:
            self.send_motor_command("/move/forward")
        elif key == Qt.Key.Key_S:
            self.send_motor_command("/move/backward")
        elif key == Qt.Key.Key_A:
            self.send_motor_command("/move/left")
        elif key == Qt.Key.Key_D:
            self.send_motor_command("/move/right")
        elif key == Qt.Key.Key_Space:
            self.send_motor_command("/move/stop")

    def closeEvent(self, event):
        self.running = False
        self.thread.join()
        self.cap.release()
        event.accept()


if __name__ == "__main__":
    app = QApplication(sys.argv)

    MODEL_PATH = "best.pt"
    STREAM_URL = "http://10.40.58.225:8080/?action=stream"
    PI_IP = "10.40.58.225"

    device = 'cpu'

    window = DetectionApp(MODEL_PATH, STREAM_URL, PI_IP, device=device)
    window.show()
    sys.exit(app.exec())
