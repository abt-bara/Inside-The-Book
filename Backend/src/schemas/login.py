from pydantic import BaseModel


class LoginResponse(BaseModel):
    id: int = 0
    role: str = ""
    name: str = ""
    username: str = ""
    username_status: bool = False
    pwd_status: bool = False


class LoginData(BaseModel):
    username: str
    password: str
