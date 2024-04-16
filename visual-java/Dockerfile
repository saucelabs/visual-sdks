FROM eclipse-temurin:11-jdk-alpine AS runner

RUN mkdir -p /workspace
WORKDIR /workspace

COPY ./tests/java/.mvn/ /workspace/.mvn
COPY ./tests/java/src /workspace/src
COPY ./tests/java/pom.xml /workspace/
COPY ./tests/java/mvnw /workspace/

RUN ./mvnw versions:use-latest-releases versions:commit
RUN ./mvnw dependency:go-offline -q
RUN ./mvnw clean test-compile

ENTRYPOINT ["./mvnw", "test" ,"-Dtest=InventoryTest"]
