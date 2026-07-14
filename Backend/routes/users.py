# routes/users.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

import os
import random
import smtplib
import ssl
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
import requests

from database import get_db
import models
import schemas

router = APIRouter()

VERIFICATION_TTL_MINUTES = 10


def generate_code():
    return "".join(random.choices("0123456789", k=6))


def send_verification_email(to_email, code):
    """Send the one-time verification code via SMTP.

    If SMTP credentials are not configured in the environment, the code is
    printed to the server console so the flow is still testable in development.
    """
    host = os.getenv("SMTP_HOST")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")
    port = int(os.getenv("SMTP_PORT", "587"))
    mail_from = os.getenv("MAIL_FROM", user or "no-reply@sonia.app")

    if not host or not user or not password:
        print(f"[DEV] Verification code for {to_email}: {code}")
        return

    message = EmailMessage()
    message["Subject"] = "Your SonIA verification code"
    message["From"] = mail_from
    message["To"] = to_email
    message.set_content(
        f"Your SonIA verification code is: {code}\n\n"
        f"It expires in {VERIFICATION_TTL_MINUTES} minutes. If you did not request this, you can ignore this email."
    )

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(host, port) as server:
            server.starttls(context=context)
            server.login(user, password)
            server.send_message(message)
    except Exception as e:
        # Don't block sign-in if mail sending fails; log and continue.
        print(f"[WARN] Failed to send verification email to {to_email}: {e}")


@router.post("/auth/signin", response_model=schemas.UserOut)
def sign_in(payload: schemas.UserSignIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if user:
        if payload.name and user.name != payload.name:
            user.name = payload.name
    else:
        user = models.User(email=payload.email, name=payload.name)
        db.add(user)

    code = generate_code()
    user.verification_code = code
    user.verification_code_expires = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_TTL_MINUTES)
    user.verified = False
    db.commit()
    db.refresh(user)

    send_verification_email(user.email, code)
    return user


@router.post("/auth/verify", response_model=schemas.UserOut)
def verify(payload: schemas.UserVerify, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.verification_code or not user.verification_code_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    if user.verification_code != payload.code:
        raise HTTPException(status_code=400, detail="Incorrect code")

    if user.verification_code_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Code expired")

    user.verification_code = None
    user.verification_code_expires = None
    user.verified = True
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/resend")
def resend(payload: schemas.UserResend, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    code = generate_code()
    user.verification_code = code
    user.verification_code_expires = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_TTL_MINUTES)
    db.commit()

    send_verification_email(user.email, code)
    return {"detail": "Verification code sent"}


@router.get("/auth/google")
def auth_google():
    """Redirects the user to Google's OAuth 2.0 consent screen.

    Environment variables expected:
    - GOOGLE_CLIENT_ID
    - GOOGLE_REDIRECT_URI (optional, defaults to http://localhost:8000/auth/google/callback)
    """
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured (missing GOOGLE_CLIENT_ID)")

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(auth_url)


@router.get("/auth/google/callback")
def auth_google_callback(code: str | None = None, db: Session = Depends(get_db)):
    """Exchanges the authorization code for tokens, fetches userinfo, and signs the user in/creates account."""
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured (missing client ID/secret)")

    token_endpoint = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    try:
        token_resp = requests.post(token_endpoint, data=data, timeout=10)
        token_resp.raise_for_status()
        token_json = token_resp.json()
    except requests.RequestException as e:
        detail = str(e)
        if e.response is not None:
            try:
                detail = e.response.text or detail
            except Exception:
                pass
        raise HTTPException(status_code=502, detail=f"Token exchange failed: {detail}")

    access_token = token_json.get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail="No access_token in token response")

    # Fetch userinfo
    try:
        userinfo_resp = requests.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        userinfo_resp.raise_for_status()
        info = userinfo_resp.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch userinfo: {e}")

    email = info.get("email")
    name = info.get("name") or info.get("given_name")

    if not email:
        raise HTTPException(status_code=502, detail="Google did not return an email")

    # Reuse sign-in logic: find or create user
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        if name and user.name != name:
            user.name = name
            db.commit()
            db.refresh(user)
    else:
        user = models.User(email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)

    # Google already verified the user's email, so skip the code step.
    user.verified = True
    db.commit()
    db.refresh(user)

    # Redirect back to frontend with user data
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    user_param = urlencode({"id": user.id, "email": user.email, "name": user.name or ""})
    return RedirectResponse(url=f"{frontend_url}?auth_success=true&{user_param}")
