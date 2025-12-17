# DOBI Backend

FastAPI backend for YOLOv8 object detection with MJPEG streaming and motor control.

## Requirements

- Python 3.10+
- CUDA (optional, for GPU acceleration)

## Installation

```bash
cd backend
pip install -r requirements.txt
```

## Running

```bash
python main.py
```

The server will start on `http://localhost:8000`

API documentation available at `http://localhost:8000/docs`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/connect` | Connect to camera stream and Pi |
| GET | `/disconnect` | Disconnect from stream |
| GET | `/video` | MJPEG video stream |
| GET | `/detections` | Current detections as JSON |
| POST | `/move/{direction}` | Motor control (forward/backward/left/right/stop) |
| GET | `/pi/test` | Test Pi connection |

## Connect Request Body

```json
{
  "stream_url": "http://10.40.58.225:8080/?action=stream",
  "pi_ip": "10.40.58.225"
}
```

## Detection Response

```json
{
  "timestamp": 1702834567.123,
  "count": 3,
  "detections": [
    {
      "name": "PERSON",
      "raw_name": "person",
      "conf": 0.87,
      "box": [100, 150, 300, 400],
      "severity": "NONE",
      "ppe_status": "SAFE"
    }
  ]
}
```

## Configuration

Place your YOLOv8 model as `best.pt` in the backend directory.

## Detection Classes

- Person (with PPE status: SAFE, UNSAFE, FULLY_PROTECTED)
- Hardhat, Safety Boots, Safety Gloves, Safety Mask, Safety Vest
- Fire (api), Smoke (asap)
- Gas, Leak, Crack, Damage
