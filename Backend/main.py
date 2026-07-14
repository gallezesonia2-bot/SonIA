# main.py
# This is the entrypoint of the backend. It creates the FastAPI app,
# sets up CORS (so the React frontend can talk to it), creates the database
# tables if they don't exist yet, and plugs in our route files.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
import models  # importing this registers the tables with Base
from routes import chat, conversations, users, attachments, projects, files, settings

# Create all database tables that don't already exist.
# (If a table already exists, this does nothing to it -- it's safe to run every time.)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Chatbot API")

# Allow our React frontend (running on localhost:5173) to make requests to this API.
# Without this, the browser blocks the requests for security reasons (CORS policy).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Backend is running!"}


# Serve uploaded attachment files (written by POST /attachments)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Plug in the routes defined in routes/chat.py and routes/conversations.py
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(users.router)
app.include_router(attachments.router)
app.include_router(projects.router)
app.include_router(files.router)
app.include_router(settings.router)