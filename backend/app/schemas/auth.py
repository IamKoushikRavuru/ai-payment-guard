"""
Pydantic Schemas for User Registration, Authentication, and Session Management.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username for SOC analyst")
    email: str = Field(..., description="Corporate or analyst email address")
    password: str = Field(..., min_length=6, description="Account password")
    full_name: Optional[str] = Field(default=None, max_length=150, description="Analyst full name")
    role: Optional[str] = Field(default="SOC Analyst", description="Role e.g., SOC Analyst, Security Engineer, Lead")


class UserLoginRequest(BaseModel):
    username_or_email: str = Field(..., description="Username or email address")
    password: str = Field(..., description="Password")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    role: str = "SOC Analyst"
    status: str = "ACTIVE"
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
