from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    admin: dict


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
