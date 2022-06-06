FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8

# Install requirements
COPY ./requirements.txt /tmp/pip-tmp/requirements.txt
RUN pip3 install --upgrade pip
RUN pip3 install -r /tmp/pip-tmp/requirements.txt && rm -rf /tmp/pip-tmp

# Add source code and set working directory
ADD ./app /app/app
EXPOSE 8001
WORKDIR /app
