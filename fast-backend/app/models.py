from sqlalchemy import Column, Integer, String, Date
from app.handlers import Base
from pydantic import BaseModel, Field


Base = Base


class FileModel(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    name = Column(String)
    created = Column(Integer)
    size = Column(Integer)
    link = Column(String)


class FileData(BaseModel):
    type: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=1000)
    created: str = Field(min_length=1, max_length=255)
    size: int = Field(gt=0)
    link: str = Field(min_length=1, max_length=5000)
