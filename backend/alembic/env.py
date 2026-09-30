# Tuna-import sys ili tuweze kuongeza project root kwenye Python path.
import sys

# Tuna-import tools za kupata absolute path ya env.py.
from os.path import abspath, dirname

# Tunaweka root ya project kwenye Python path.
sys.path.insert(0, dirname(dirname(abspath(__file__))))


# Tuna-import fileConfig kwa ajili ya logging ya Alembic.
from logging.config import fileConfig

# Tuna-import SQLAlchemy engine na connection pool.
from sqlalchemy import engine_from_config, pool

# Tuna-import Alembic context.
from alembic import context

# Tuna-import settings zetu zinazohifadhi DATABASE_URL.
from app.core.config import settings

# Tuna-import Base halisi inayotumika na models zetu.
from app.models.base import Base

# Tuna-import db.base ili models zote zisomwe na SQLAlchemy.
# Hii ni muhimu sana kwa Alembic autogenerate.
from app.db import base


# Config object ya Alembic.
config = context.config


# Tunaweka DATABASE_URL kutoka kwenye .env/settings.
config.set_main_option(
    "sqlalchemy.url",
    settings.DATABASE_URL
)


# Kama alembic.ini ina logging configuration, tunaiwasha.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# Tunaipa Alembic metadata yenye models zote za project.
target_metadata = Base.metadata

# OFFLINE MIGRATIONS

def run_migrations_offline() -> None:
    """Run migrations in offline mode."""

    # Tunachukua database URL kutoka kwenye configuration.
    url = config.get_main_option("sqlalchemy.url")

    # Tuna-configure Alembic bila ku-connect moja kwa moja kwenye database.
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    # Tunaanza transaction ya migration.
    with context.begin_transaction():

        # Tuna-run migrations.
        context.run_migrations()


# ONLINE MIGRATIONS

def run_migrations_online() -> None:
    """Run migrations in online mode."""

    # Tunatengeneza database engine kutoka kwenye configuration.
    connectable = engine_from_config(
        config.get_section(
            config.config_ini_section,
            {}
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    # Tuna-connect kwenye PostgreSQL database.
    with connectable.connect() as connection:

        # Tuna-configure Alembic kutumia connection na models zetu.
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        # Tunaanza transaction ya migration.
        with context.begin_transaction():

            # Tuna-run migration.
            context.run_migrations()


# Tunaamua kama migration ni offline au online.
if context.is_offline_mode():

    # Tuna-run offline migration.
    run_migrations_offline()

else:

    # Tuna-run online migration.
    run_migrations_online()