# DOBI Backend

YOLOv8 Detection Engine with PyQt6 UI and Motor Control.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Place your YOLO model file (`best.pt`) in this directory.

3. Update the configuration in `main.py`:
   - `STREAM_URL`: Your camera stream URL
   - `PI_IP`: Your Raspberry Pi IP address

4. Run the backend:
```bash
python main.py
```

## Controls

- **W** - Move forward
- **S** - Move backward
- **A** - Move left
- **D** - Move right
- **Space** - Stop

## Detection Classes

- Person (with PPE status: SAFE, UNSAFE, FULLY_PROTECTED)
- Hardhat, Safety Boots, Safety Gloves, Safety Mask, Safety Vest
- Fire (api), Smoke (asap)
- Gas, Leak, Crack, Damage
