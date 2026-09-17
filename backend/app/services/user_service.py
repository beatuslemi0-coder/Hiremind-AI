
# Tunatumia SQLAlchemy Session ili service iweze kufanya kazi
# na database kupitia repository.
from sqlalchemy.orm import Session

# Tuna-import User model ambayo inawakilisha users table.
from app.models.user import User

# Tuna-import UserRepository kwa ajili ya database operations.
from app.repositories.user_repository import UserRepository

# Tuna-import password hashing function.
# Hii itabadilisha password kuwa hash salama kabla ya kuihifadhi.
from app.core.security import hash_password

#Function ya kusibitisha password wakati wa Login
from app.core.security import verify_password


class UserService:

    # Function hii inasajili user mpya kwenye mfumo.
    @staticmethod
    def create_user(
        db: Session,
        username: str,
        email: str,
        password: str,
        role: str = "interviewee"
    ) -> User:

        # Tunaangalia kama email tayari ipo kwenye database.
        existing_email = UserRepository.get_by_email(
            db,
            email
        )

        # Kama email ipo, tunazuia user mwingine kutumia email hiyo.
        if existing_email:
            raise ValueError(
                "Email is already registered"
            )

        # Tunaangalia kama username tayari ipo kwenye database.
        existing_username = UserRepository.get_by_username(
            db,
            username
        )

        # Kama username ipo, tunazuia duplicate username.
        if existing_username:
            raise ValueError(
                "Username is already taken"
            )

        # Password halisi haipaswi kuhifadhiwa kwenye database.
        # Tunaihash kwanza kwa kutumia hashing function.
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
        # ---------------------------------------------------------
    # Kutafuta user wakati wa login na kuthibitisha password.
    # ---------------------------------------------------------
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

        # Tunalinganisha password aliyoweka user
        # na password hash iliyopo database.
        if not verify_password(
            password,
            user.hashed_password
        ):
            return None

        # Kama kila kitu kiko sawa, tunarudisha user.
        return user
    
