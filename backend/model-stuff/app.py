import streamlit as st
import cv2
import torch
import numpy as np
from PIL import Image
from torchvision import transforms, models
from ultralytics import YOLO
import torch.nn as nn

st.title("🍎🍌🍊 Real-time Fruit Freshness Detection")

# Load class labels
class_labels = [
    "apple_fresh", "apple_rotten",
    "banana_fresh", "banana_rotten",
    "orange_fresh", "orange_rotten"
]

# Load classifier model
classifier = models.mobilenet_v2(pretrained=False)
classifier.classifier[1] = nn.Linear(classifier.last_channel, len(class_labels))
classifier.load_state_dict(torch.load("fruit_freshness_resnet_small.pth", map_location="cpu"))
classifier.eval()

# Transform for classifier
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Load YOLOv8
yolo = YOLO("yolov8n.pt")
target_classes = ["apple", "banana", "orange"]
target_ids = [cls_id for cls_id, name in yolo.model.names.items() if name in target_classes]

# Webcam button
run = st.checkbox('Start Webcam')
FRAME_WINDOW = st.image([])

if run:
    cap = cv2.VideoCapture(0)
    while run:
        ret, frame = cap.read()
        if not ret:
            break

        # YOLO detection
        results = yolo(frame, verbose=False)[0]

        for box in results.boxes:
            cls_id = int(box.cls)
            if cls_id in target_ids:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                crop = frame[y1:y2, x1:x2]

                try:
                    image_pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
                    tensor = transform(image_pil).unsqueeze(0)
                    with torch.no_grad():
                        output = classifier(tensor)
                        pred_class = class_labels[output.argmax().item()]

                    label = f"{pred_class}"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(frame, label, (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                except Exception as e:
                    print("Error processing crop:", e)

        FRAME_WINDOW.image(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    cap.release()
else:
    st.write("✔️ Click 'Start Webcam' to begin.")
