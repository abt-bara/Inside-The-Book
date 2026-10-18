from fastapi import APIRouter, Depends

from api_config import API_CONFIG
from schemas.login import LoginData, LoginResponse
from services.user_service import UserService

router = APIRouter(prefix=API_CONFIG["apiPrefix"])


def get_user_service() -> UserService:
    return UserService()


@router.post(API_CONFIG["api"]["login"], response_model=LoginResponse)
def login(data: LoginData, user_service: UserService = Depends(get_user_service)):
    return user_service.login(data.username, data.password)
