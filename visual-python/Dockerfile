FROM python:3.12-slim-bookworm

COPY . .

RUN pip install -r requirements/dev.txt

RUN pip install .

ENTRYPOINT ["robot", "--variable", "NO_BUILD_NAME:True", "--test", "Login", "integration-tests/robot"]