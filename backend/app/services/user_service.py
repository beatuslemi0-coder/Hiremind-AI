
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.core.security import hash_password
from app.core.security import verify_password


class UserService:

    @staticmethod
    def create_user(
        db: Session,
        username: str,
        email: str,
        password: str,
        role: str = "interviewee"
    ) -> User:


        existing_email = UserRepository.get_by_email(
            db,
            email
        )

        if existing_email:
            raise ValueError(
                "Email is already registered"
            )

        existing_username = UserRepository.get_by_username(
            db,
            username
        )

        if existing_username:
            raise ValueError(
                "Username is already taken"
            )

        hashed_password = hash_password(password)

        # Tunatengeneza User object mpya.
        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role=role,
            is_active=True
        )

        # Tunatumia repository kuhifadhi user kwenye PostgreSQL.
        return UserRepository.create(
            db,
            user
        )
        
    @staticmethod
    def authenticate_user(
        db: Session,
        email: str,
        password: str
    ) -> User | None:

        # Tunatafuta user kwa kutumia email.
        user = UserRepository.get_by_email(
            db,
            email
        )

        # Kama email haipo, login inakataliwa.
        if user is None:
            return None

        # Tunahakikisha account bado iko active.
        if not user.is_active:
            return None

        if not verify_password(
            password,
            user.hashed_password
        ):
            return None

        return user
    
