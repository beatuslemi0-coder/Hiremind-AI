from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.user import User
class UserRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        user_id: int
    ) -> User | None:
        return db.get(User, user_id)

    @staticmethod
    def get_by_email(
        db: Session,
        email: str
    ) -> User | None:
        statement = select(User).where(
            User.email == email
        )

        return db.scalar(statement)

    @staticmethod
    def get_by_username(
        db: Session,
        username: str
    ) -> User | None:
        statement = select(User).where(
            User.username == username
        )

        return db.scalar(statement)

    @staticmethod
    def create(
        db: Session,
        user: User
    ) -> User:
        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def get_all(
        db: Session
    ) -> list[User]:
        statement = select(User)

        return list(
            db.scalars(statement).all()
        )

    @staticmethod
    def delete(
        db: Session,
        user: User
    ) -> None:
        db.delete(user)
        db.commit()