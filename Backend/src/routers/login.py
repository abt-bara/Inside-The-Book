from fastapi import APIRouter, Depends

from schemas.login import LoginData, LoginResponse
from services.user_service import UserService

router = APIRouter(prefix="/auth")


def get_user_service() -> UserService:
    return UserService()


@router.post("/login", response_model=LoginResponse)
def login(data: LoginData, user_service: UserService = Depends(get_user_service)):
    return user_service.login(data.username, data.password)
