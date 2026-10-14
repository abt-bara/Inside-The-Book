import hmac

from schemas.login import LoginResponse
from utils.hash_it import hash_it

USERS = {
    "admin": {
        "id": 1,
        "role": "admin",
        "name": "Admin",
        "password_hash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
    },
    "ali": {
        "id": 2,
        "role": "user",
        "name": "Ali",
        "password_hash": "0a041b9462caa4a31bac3567e0b6e6fd9100787db2ab433d96f6d178cabfce90",
    },
    "ahmed": {
        "id": 3,
        "role": "user",
        "name": "Ahmed",
        "password_hash": "6025d18fe48abd45168528f18a82e265dd98d421a7084aa09f61b341703901a3",
    },
}


class UserService:
    def __init__(self, db=None):
        self.db = db

    def login(self, username: str, password: str) -> LoginResponse:
        user = USERS.get(username)
        if user is None:
            return LoginResponse()

        hashed_password = hash_it([password])[0]
        if not hmac.compare_digest(user["password_hash"], hashed_password):
            return LoginResponse(
                username=username,
                username_status=True,
                pwd_status=False,
            )

        return LoginResponse(
            id=user["id"],
            role=user["role"],
            name=user["name"],
            username=username,
            username_status=True,
            pwd_status=True,
        )
