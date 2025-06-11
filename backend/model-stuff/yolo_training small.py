import torch
import cv2
from torchvision import models, transforms
from PIL import Image
import torch.nn as nn
from ultralytics import YOLO
from torchvision.models import mobilenet_v2

# Load your trained ResNet classifier
class_labels = [
    "apple_fresh", "apple_rotten",
    "banana_fresh", "banana_rotten",
    "orange_fresh", "orange_rotten"
]

# Use torchvision model (ResNet18 or MobileNet)
model = mobilenet_v2(pretrained=False)
model.classifier[1] = nn.Linear(model.last_channel, len(class_labels))
model.load_state_dict(torch.load("fruit_freshness_resnet_small.pth", map_location="cpu"))
model.eval()

# Image transform for classifier
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485, 0.456, 0.406], 
        [0.229, 0.224, 0.225]
    )
])

# Load YOLOv8 model for fruit detection
yolo = YOLO("yolov8n.pt")  # Nano version for speed

# YOLO class names for fruits
target_classes = ["apple", "banana", "orange"]
target_ids = [cls_id for cls_id, name in yolo.model.names.items() if name in target_classes]

# Open webcam or video
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Run YOLO detection
    results = yolo(frame, verbose=False)[0]

    for box in results.boxes:
        cls_id = int(box.cls)
        if cls_id in target_ids:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            fruit_crop = frame[y1:y2, x1:x2]

            # Preprocess crop for ResNet
            image_pil = Image.fromarray(cv2.cvtColor(fruit_crop, cv2.COLOR_BGR2RGB))
            image_tensor = transform(image_pil).unsqueeze(0)

            with torch.no_grad():
                output = model(image_tensor)
                predicted_class = class_labels[output.argmax().item()]

            # 📦 Draw box and label
            label = f"{predicted_class}"
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    # 🖼️ Show the frame
    cv2.imshow("Fruit Freshness Detector", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
