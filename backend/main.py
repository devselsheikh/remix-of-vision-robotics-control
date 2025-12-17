# DOBI - Detection & Motor Control Backend
# FastAPI server with MJPEG streaming and YOLOv8 detection
# Run with: python main.py

import cv2
import numpy as np
from ultralytics import YOLO
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from threading import Thread, Lock
import requests
import time
import uvicorn

app = FastAPI(title="DOBI Backend", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionConfig(BaseModel):
    stream_url: str
    pi_ip: str


class DetectionEngine:
    IOU_THRESHOLD = 0.05

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
                "box": [x1, y1, x2, y2],
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

        for det in detections:
            x1, y1, x2, y2 = det["box"]
            label = f"{det['name']} {det['conf']:.2f}"

            if det.get("raw_name") == "person":
                label += f" ({det.get('ppe_status', 'UNKNOWN')})"
                color = (0, 255, 0) if det.get("ppe_status") in ["SAFE", "FULLY_PROTECTED"] else (0, 0, 255)
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


# Global state
class AppState:
    def __init__(self):
        self.detection_engine = None
        self.cap = None
        self.stream_url = None
        self.pi_ip = None
        self.frame = None
        self.detections = []
        self.lock = Lock()
        self.running = False
        self.thread = None

    def connect(self, stream_url: str, pi_ip: str, model_path: str = "best.pt", device: str = "cpu"):
        self.stop()
        
        self.stream_url = stream_url
        self.pi_ip = pi_ip
        
        if self.detection_engine is None:
            self.detection_engine = DetectionEngine(model_path, device)
        
        self.cap = cv2.VideoCapture(stream_url)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
        if not self.cap.isOpened():
            raise Exception(f"Failed to open video stream: {stream_url}")
        
        self.running = True
        self.thread = Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        
        return True

    def _capture_loop(self):
        while self.running:
            if self.cap is None:
                break
            ret, frame = self.cap.read()
            if not ret:
                time.sleep(0.01)
                continue
            
            detections, annotated = self.detection_engine.process_frame(frame)
            
            with self.lock:
                self.frame = annotated
                self.detections = detections

    def get_frame(self):
        with self.lock:
            if self.frame is None:
                return None
            return self.frame.copy()

    def get_detections(self):
        with self.lock:
            return self.detections.copy()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
            self.thread = None
        if self.cap:
            self.cap.release()
            self.cap = None


state = AppState()


# API Endpoints

@app.get("/health")
async def health_check():
    return {"status": "ok", "connected": state.running}


@app.post("/connect")
async def connect(config: ConnectionConfig):
    try:
        state.connect(config.stream_url, config.pi_ip)
        return {"status": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


@app.get("/disconnect")
async def disconnect():
    state.stop()
    return {"status": "disconnected"}


@app.get("/detections")
async def get_detections():
    detections = state.get_detections()
    return {
        "timestamp": time.time(),
        "count": len(detections),
        "detections": detections
    }


def generate_mjpeg():
    while True:
        frame = state.get_frame()
        if frame is None:
            placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(placeholder, "No Video Signal", (180, 240),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (100, 100, 100), 2)
            frame = placeholder
        
        _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
        time.sleep(0.033)


@app.get("/video")
async def video_feed():
    return StreamingResponse(
        generate_mjpeg(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.post("/move/{direction}")
async def move(direction: str):
    if state.pi_ip is None:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Not connected to Pi"}
        )
    
    valid_directions = ["forward", "backward", "left", "right", "stop"]
    if direction not in valid_directions:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": f"Invalid direction: {direction}"}
        )
    
    try:
        url = f"http://{state.pi_ip}:5000/move/{direction}"
        response = requests.get(url, timeout=1)
        if response.status_code == 200:
            return {"status": "ok", "direction": direction}
        else:
            return JSONResponse(
                status_code=response.status_code,
                content={"status": "error", "message": "Pi returned error"}
            )
    except requests.exceptions.Timeout:
        return JSONResponse(
            status_code=504,
            content={"status": "error", "message": "Pi connection timeout"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


@app.get("/pi/test")
async def test_pi_connection():
    if state.pi_ip is None:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Pi IP not configured"}
        )
    
    try:
        url = f"http://{state.pi_ip}:5000/health"
        requests.get(url, timeout=2)
        return {"status": "ok", "pi_ip": state.pi_ip}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


if __name__ == "__main__":
    print("Starting DOBI Backend Server...")
    print("API Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
