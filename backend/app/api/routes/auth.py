"""
Authentication & User Account Management Routes.
Persists registered users, verifies hashed passwords, and issues tokens.
"""

from __future__ import annotations

import hashlib
import logging
import secrets
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.connection import get_db_session
from backend.app.database.repositories import UserRepository
from backend.app.schemas.auth import (
    AuthResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & Accounts"])
logger = logging.getLogger("auth")


def hash_password(password: str) -> str:
    """Hashes password with PBKDF2-HMAC-SHA256 and unique 16-byte salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}${key.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Constant-time verification of password against salt-hashed digest."""
    if not hashed or "$" not in hashed:
        return False
    salt, key_hex = hashed.split("$", 1)
    new_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return secrets.compare_digest(new_key.hex(), key_hex)


TOKEN_USER_MAP: Dict[str, str] = {}


def create_token(user_id: str) -> str:
    """Generates an opaque cryptographic bearer token and tracks active session."""
    token = f"aegis_sec_{secrets.token_urlsafe(32)}"
    TOKEN_USER_MAP[token] = user_id
    return token


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Analyst Account",
)
async def register(
    req: UserRegisterRequest,
    session: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    """Creates a new user account and stores it in the database."""
    user_repo = UserRepository(session)

    # Check for existing email
    existing_email = await user_repo.get_by_email(req.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{req.email}' is already registered.",
        )

    # Check for existing username
    existing_user = await user_repo.get_by_username(req.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{req.username}' is already taken.",
        )

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    hashed_pw = hash_password(req.password)

    user_data = {
        "id": user_id,
        "username": req.username.strip().lower(),
        "email": req.email.strip().lower(),
        "full_name": req.full_name or req.username,
        "password_hash": hashed_pw,
        "role": req.role or "SOC Analyst",
        "status": "ACTIVE",
    }

    created = await user_repo.create(user_data)
    logger.info("New user registered: %s (id: %s)", created.username, created.id)

    token = create_token(created.id)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(created),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Analyst Login",
)
async def login(
    req: UserLoginRequest,
    session: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    """Authenticates analyst credentials against the database."""
    user_repo = UserRepository(session)

    lookup = req.username_or_email.strip().lower()
    # Check by email or username
    user = await user_repo.get_by_email(lookup)
    if not user:
        user = await user_repo.get_by_username(lookup)

    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
        )

    logger.info("User logged in successfully: %s", user.username)
    token = create_token(user.id)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User Profile",
)
async def get_current_user(
    authorization: Optional[str] = Header(default=None),
    user_id: Optional[str] = None,
    session: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    """Returns profile for current session."""
    user_repo = UserRepository(session)

    target_id = user_id
    if not target_id and authorization:
        bearer_token = authorization.replace("Bearer ", "").strip()
        target_id = TOKEN_USER_MAP.get(bearer_token)

    if not target_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please sign in or register to access the SOC.",
        )

    user = await user_repo.get_by_id(target_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return UserResponse.model_validate(user)


@router.post(
    "/logout",
    summary="Analyst Logout",
)
async def logout(authorization: Optional[str] = Header(default=None)) -> Dict[str, str]:
    """Invalidates session on client and logs out analyst."""
    if authorization:
        bearer_token = authorization.replace("Bearer ", "").strip()
        TOKEN_USER_MAP.pop(bearer_token, None)
    return {"status": "ok", "message": "Successfully logged out."}


@router.get(
    "/users",
    response_model=List[UserResponse],
    summary="List SOC Analysts",
)
async def list_users(session: AsyncSession = Depends(get_db_session)) -> List[UserResponse]:
    """Lists registered analysts in the system."""
    user_repo = UserRepository(session)
    users = await user_repo.list_recent(limit=50)
    return [UserResponse.model_validate(u) for u in users]
