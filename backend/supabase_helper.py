from supabase import create_client, Client
import os
from datetime import datetime
import uuid

SUPABASE_URL = "https://aztbyvacjftlpwiokyvh.supabase.co" 
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dGJ5dmFjamZ0bHB3aW9reXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjAxMTksImV4cCI6MjA2NDg5NjExOX0.5Sb2_9t1s6ktXauxzigRF_7IOzcuV_HUegA9Hpx9q-4" 
SUPABASE_BUCKET = "detections"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_image_to_supabase(image_path: str, dest_name: str) -> str:
    """
    Uploads a file to Supabase storage and returns the public URL.
    """
    with open(image_path, "rb") as f:
        supabase.storage.from_(SUPABASE_BUCKET).upload(file=f, path=dest_name, file_options={"content-type": "image/jpeg"})

    public_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(dest_name)
    return public_url

def insert_detection(source: str, label: str, confidence: float, image_url: str, expiry_estimate: datetime = None):
    """
    Inserts a row into the `detections` table.
    """
    data = {
        "source": source,
        "label": label,
        "confidence": confidence,
        "image_url": image_url,
        "detected_at": datetime.utcnow().isoformat(),
        "used": False,
        "expiry_estimate": expiry_estimate.isoformat() if expiry_estimate else None
    }
    supabase.table("detections").insert(data).execute()
