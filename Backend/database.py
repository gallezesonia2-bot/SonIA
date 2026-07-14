# database.py
# This file sets up the connection between our app and the PostgreSQL database.

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load variables from the .env file (like DATABASE_URL) into the environment
load_dotenv()

# Read the database connection string from .env
# Example format: postgresql://username:password@localhost/chatbot_db
DATABASE_URL = os.getenv("DATABASE_URL")

# The "engine" is what actually talks to PostgreSQL
engine = create_engine(DATABASE_URL)

# SessionLocal is a factory that creates new database "sessions" (conversations
# with the database) whenever we need one, e.g. for one API request.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the class our database models (tables) will inherit from.
Base = declarative_base()


# This function gives each API request its own database session,
# and makes sure it's closed properly afterwards (even if an error happens).
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()