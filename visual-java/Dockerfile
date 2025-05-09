FROM eclipse-temurin:11-jdk-alpine AS runner

RUN mkdir -p /workspace
WORKDIR /workspace

COPY ./.mvn /workspace/.mvn
COPY ./src /workspace/src
COPY ./pom.xml /workspace/
COPY ./mvnw /workspace/

RUN ./mvnw -q clean test-compile

ENTRYPOINT ["./mvnw", "-q", "test" ,"-Dtest=com.saucelabs.visual.env.**"]
