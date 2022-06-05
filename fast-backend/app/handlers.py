import os
import aioredis

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from app.singleton import Singleton

REDIS_SERVICE = os.environ.get("REDIS_SERVICE", "user_man_db")
SQLALCHEMY_DATABASE_URL = "sqlite:///./models.db"


class RedisHandler(metaclass=Singleton):

    async def init(self):
        self.redis = aioredis.from_url(
            f"redis://{REDIS_SERVICE}", encoding="utf-8", decode_responses=True
        )


# class SqlHandler(metaclass=Singleton):

#     async def init(self):
#         self.engine = create_engine(
#             SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
#         )

#         self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

#         self.Base = declarative_base()

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
