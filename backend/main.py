from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import torch
import numpy as np
import cv2
from PIL import Image
from torchvision import transforms, models
from ultralytics import YOLO
import torch.nn as nn
import logging
import serial
import json
import threading
import time
from pydantic import BaseModel

app = FastAPI()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Allow all CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Fruit Classification Setup ---
# Labels for fruit freshness classification
class_labels = [
    "apple_fresh", "apple_rotten",
    "banana_fresh", "banana_rotten",
    "orange_fresh", "orange_rotten"
]

# Load classifier - MobileNetV2
try:
    classifier = models.mobilenet_v2(pretrained=False)
    classifier.classifier[1] = nn.Linear(classifier.last_channel, len(class_labels))
    
    classifier.load_state_dict(torch.load("model-stuff/fruit_freshness_resnet_small.pth", map_location="cpu"))
    classifier.eval()
    logger.info("Classifier loaded successfully")
except Exception as e:
    logger.error(f"Failed to load classifier: {e}")
    raise

# Transform for image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# YOLO model for object detection
try:
    yolo = YOLO("yolov8n.pt")
    target_classes = ["apple", "banana", "orange"]
    target_ids = [cls_id for cls_id, name in yolo.model.names.items() if name in target_classes]
    logger.info(f"YOLO loaded successfully. Target IDs: {target_ids}")
except Exception as e:
    logger.error(f"Failed to load YOLO: {e}")
    raise

# --- Arduino Sensor Data Handling ---
SERIAL_PORT = 'COM4'  
BAUD_RATE = 9600
latest_sensor_data = {}  # Store the latest full data from Arduino
sensor_data_lock = threading.Lock()  # To protect concurrent access
stop_sensor_thread = threading.Event()

# Webcam control
stop_webcam = False

class SensorDataModel(BaseModel):
    """Pydantic model for structured sensor response"""
    timestamp: int | None = None
    sensor_id: str | None = None
    dht22: dict | None = None
    mq2: dict | None = None
    air_quality: str | None = None
    error: str | None = None

def read_from_arduino():
    """Background thread function to read data from Arduino"""
    global latest_sensor_data
    ser = None
    while not stop_sensor_thread.is_set():
        try:
            if ser is None or not ser.is_open:
                logger.info(f"Attempting to connect to Arduino on {SERIAL_PORT}...")
                ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
                logger.info(f"Connected to Arduino on {SERIAL_PORT}")
                # Give Arduino time to reset after serial connection
                time.sleep(2) 
                ser.flushInput()  # Flush input buffer to get fresh data

            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').rstrip()
                if line:
                    logger.debug(f"Raw from Arduino: {line}")
                    try:
                        data = json.loads(line)
                        with sensor_data_lock:
                            latest_sensor_data = data
                        logger.info(f"Received sensor data: {data.get('sensor_id', 'N/A')}, Temp: {data.get('dht22', {}).get('temperature_c', 'N/A')}")
                    except json.JSONDecodeError as e:
                        logger.warning(f"Could not decode JSON from Arduino: {line} - Error: {e}")
                    except Exception as e:
                        logger.error(f"Error processing Arduino data: {e}")
        except serial.SerialException as e:
            logger.error(f"Serial error: {e}. Retrying in 5 seconds...")
            if ser and ser.is_open:
                ser.close()
            ser = None  # Reset ser object
            time.sleep(5)
        except Exception as e:
            logger.error(f"Unhandled error in sensor thread: {e}")
            time.sleep(5)  # Prevent rapid looping on unknown errors
    
    if ser and ser.is_open:
        ser.close()
    logger.info("Sensor reading thread stopped.")

@app.on_event("startup")
async def startup_event():
    """Start the sensor reading thread on app startup"""
    stop_sensor_thread.clear()
    sensor_thread = threading.Thread(target=read_from_arduino, daemon=True)
    sensor_thread.start()
    logger.info("Arduino sensor reading thread started.")

@app.on_event("shutdown")
def shutdown_event():
    """Stop the sensor reading thread on app shutdown"""
    stop_sensor_thread.set()
    logger.info("Stopping Arduino sensor reading thread...")

# --- API Endpoints ---

@app.get("/sensors", response_model=SensorDataModel)
async def get_sensor_data():
    """Get the latest sensor data from Arduino"""
    with sensor_data_lock:
        if not latest_sensor_data:
            return SensorDataModel(error="No sensor data available yet.")
        # Return a copy to avoid modification issues
        return SensorDataModel(**latest_sensor_data)

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    """Predict fruit freshness from uploaded image"""
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        img_bytes = await image.read()
        npimg = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        results = yolo(frame, verbose=False, conf=0.5, iou=0.45)[0]
        predictions = []

        for box in results.boxes:
            cls_id = int(box.cls)
            if cls_id in target_ids:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                # Validate crop dimensions
                if x2 <= x1 or y2 <= y1:
                    logger.warning(f"Invalid bounding box: {[x1, y1, x2, y2]}")
                    continue
                
                crop = frame[y1:y2, x1:x2]
                
                if crop.size == 0:
                    logger.warning("Empty crop detected, skipping")
                    continue
                
                try:
                    image_pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
                    tensor = transform(image_pil).unsqueeze(0)
                    
                    with torch.no_grad():
                        output = classifier(tensor)
                        confidence = torch.softmax(output, dim=1)
                        pred_idx = output.argmax().item()
                        pred_class = class_labels[pred_idx]
                        pred_confidence = confidence[0][pred_idx].item()
                    
                    predictions.append({
                        "bbox": [x1, y1, x2, y2],  
                        "label": pred_class,
                        "confidence": round(pred_confidence, 3),
                        "detected_object": yolo.model.names[cls_id]
                    })
                    
                except Exception as e:
                    logger.error(f"Classification error: {e}")
                    predictions.append({
                        "bbox": [x1, y1, x2, y2],
                        "error": f"Classification failed: {str(e)}"
                    })

        return {"predictions": predictions, "total_detections": len(predictions)}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

def gen_frames():
    """Generate frames for webcam streaming with real-time fruit detection"""
    global stop_webcam
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        logger.error("Cannot open webcam")
        return

    # Set webcam resolution to standard 16:9 aspect ratio
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    actual_width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    actual_height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    logger.info(f"Webcam resolution: {actual_width}x{actual_height}")

    while not stop_webcam:
        ret, frame = cap.read()
        if not ret:
            logger.error("Failed to read frame from webcam")
            break

        results = yolo(frame, verbose=False)[0]

        for box in results.boxes:
            cls_id = int(box.cls)
            if cls_id in target_ids:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                label = yolo.model.names[cls_id]
                conf = box.conf.item()

                # Crop and classify freshness
                crop = frame[y1:y2, x1:x2]
                if crop.size == 0:
                    continue

                try:
                    image_pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
                    tensor = transform(image_pil).unsqueeze(0)

                    with torch.no_grad():
                        output = classifier(tensor)
                        confidence = torch.softmax(output, dim=1)
                        pred_idx = output.argmax().item()
                        pred_class = class_labels[pred_idx]
                        pred_conf = confidence[0][pred_idx].item()

                    # Draw classification result
                    label_text = f"{pred_class} ({conf:.2f}/{pred_conf:.2f})"
                except Exception as e:
                    logger.error(f"Classification error during webcam: {e}")
                    label_text = f"{label} (YOLO Only)"

                # Draw box with better colors for fresh/rotten
                color = (0, 255, 0) if "fresh" in pred_class.lower() else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                
                # Add text background for better visibility
                text_size = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                cv2.rectangle(frame, (x1, y1 - text_size[1] - 10), 
                            (x1 + text_size[0], y1), color, -1)
                cv2.putText(frame, label_text, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    cap.release()

@app.get("/webcam")
def webcam_feed():
    """Start webcam streaming with real-time fruit detection"""
    global stop_webcam
    stop_webcam = False
    return StreamingResponse(gen_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/stop-webcam")
def stop_webcam_feed():
    """Stop webcam streaming"""
    global stop_webcam
    stop_webcam = True
    return {"status": "stopped"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "model_loaded": True,
        "sensor_data_available": bool(latest_sensor_data)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
