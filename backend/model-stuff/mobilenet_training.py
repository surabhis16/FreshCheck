import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from torchvision.models import mobilenet_v2
import os

# 🧱 1. Paths
train_dir = "dataset/train"
val_dir = "dataset/test"
model_save_path = "fruit_freshness_resnet_small.pth"

# 🔁 2. Data Transforms
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485, 0.456, 0.406], 
        [0.229, 0.224, 0.225]
    )
])

# 📦 3. Datasets & Loaders
train_data = datasets.ImageFolder(train_dir, transform=transform)
val_data = datasets.ImageFolder(val_dir, transform=transform)
train_loader = DataLoader(train_data, batch_size=32, shuffle=True)
val_loader = DataLoader(val_data, batch_size=32)

# 🔍 4. Model Setup
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = mobilenet_v2(pretrained=True)
model.classifier[1] = nn.Linear(model.last_channel, len(train_data.classes))
model = model.to(device)

# ⚙️ 5. Training Setup
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-4)

# 🏋️ 6. Training Loop
for epoch in range(10):  # more if needed
    model.train()
    running_loss = 0
    for imgs, labels in train_loader:
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad()
        output = model(imgs)
        loss = criterion(output, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()
    
    print(f"Epoch {epoch+1}, Loss: {running_loss:.4f}")

# 💾 7. Save Model
torch.save(model.state_dict(), model_save_path)
print(f"Model saved to {model_save_path}")
