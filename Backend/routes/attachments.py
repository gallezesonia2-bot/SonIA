# routes/attachments.py
# Handles uploading files attached to a message. Uploaded files are stored on
# disk under the `uploads/` directory and served statically at /uploads/<id>.

import os
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
ALLOWED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
    ".pdf", ".txt", ".md", ".csv", ".json", ".doc", ".docx", ".xlsx", ".pptx",
    ".py", ".js", ".ts", ".tsx", ".jsx", ".zip",
}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/attachments")
async def upload_attachment(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, stored_name)
    with open(path, "wb") as f:
        f.write(content)

    return {
        "filename": file.filename or stored_name,
        "url": f"/uploads/{stored_name}",
        "content_type": file.content_type or "application/octet-stream",
        "size": len(content),
    }
