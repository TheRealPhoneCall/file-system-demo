import os
import asyncio
import json

from datetime import timedelta, datetime
from typing import List

from jaeger_client import Config
from opentracing.scope_managers.contextvars import ContextVarsScopeManager

from sqlalchemy.orm import Session

from fastapi import FastAPI, status, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.exceptions import HTTPException
from fastapi.param_functions import Depends
# from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware

from app import (
    JAEGER_HOST,
    JAEGER_PORT,
    __root__,
    __service__,
    __version__,
    __startup_time__,
    __token__,
    __files_path__
)
from app.handlers import RedisHandler, SessionLocal, Base, engine
from app.models import FileModel, FileData
from app.tracing import TracingMiddleWare


app = FastAPI(title=__service__, root_path=__root__, version=__version__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = Config(
    config={
        'sampler': {
            'type': 'const',
            'param': 1,
        },
        'local_agent': {
            'reporting_host': JAEGER_HOST,
            'reporting_port': JAEGER_PORT,
        },
        'logging': True,
    },
    scope_manager=ContextVarsScopeManager(),
    service_name=__service__,
    validate=True,
)

jaeger_tracer = config.initialize_tracer()
app.add_middleware(TracingMiddleWare, tracer=jaeger_tracer)


Base.metadata.create_all(bind=engine)


def get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


@app.on_event("startup")
async def startup():
    # Wait for RabbitMQ and Redis
    await asyncio.sleep(__startup_time__)
    await RedisHandler().init()


@app.get("/")
async def root():
    return {"Service": __service__, "Version": __version__}


@app.get("/hello")
async def hello():
    return {"Message": "Hello world, from FastAPI!"}


@app.get("/status")
async def get_status():
    # Add checks to ensure the system is running
    return False


@app.get("/files")
async def get_files(db: Session = Depends(get_db)):
    return db.query(FileModel).all()


@app.post("/files")
async def create_file(file: UploadFile = File(...),
                      db: Session = Depends(get_db)):

    try:
        contents = await file.read()
        file_path = os.path.join(__root__, __files_path__, file.filename)
        print(file_path)
        with open(file_path, 'wb') as f:
            f.write(contents)

        print('file', file)
        file_model = FileModel()
        file_model.type = file.content_type
        file_model.name = file.filename
        file_model.created = datetime.now()
        file_model.size = len(contents)
        file_model.link = file_path

        db.add(file_model)
        db.commit()
    except Exception:
        raise HTTPException(
            status_code=404,
            detail=f"There was an error uploading the file: {file.filename}"
        )

    return {"message": f"Successfully uploaded {file.filename}", "file": file_model}


@app.get("/file/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(__root__, __files_path__, filename)
    print(file_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    raise HTTPException(
        status_code=404,
        detail=f"File does not exist"
    )


@app.put("/files/{file_id}")
async def update_file(file_id: int, data: FileData, db: Session = Depends(get_db)):
    file = db.query(FileModel).filter(FileModel.id == file_id).first()

    if file is None:
        raise HTTPException(
            status_code=404,
            detail=f"ID {file_id} : Does not exist"
        )

    file.type = data.type
    file.name = data.name
    file.created = data.created
    file.size = data.size

    db.add(file)
    db.commit()

    return file


@app.delete("/files/{file_id}")
async def delete_file(file_id: int, db: Session = Depends(get_db)):

    print("deleting file", file_id)

    file = db.query(FileModel).filter(FileModel.id == file_id).first()

    if file is None:
        raise HTTPException(
            status_code=404,
            detail=f"ID {file_id} : Does not exist"
        )

    file_path = os.path.join(__root__, __files_path__, file.name)
    print(file_path)
    if os.path.exists(file_path):
        os.remove(file_path)
    else:
        raise HTTPException(
            status_code=404,
            detail=f"The file to be deleted does not exist."
        )

    db.query(FileModel).filter(FileModel.id == file_id).delete()

    db.commit()

    return 'File deleted'
