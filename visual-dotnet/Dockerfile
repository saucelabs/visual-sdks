FROM mcr.microsoft.com/dotnet/sdk:6.0

WORKDIR /app
COPY . .

RUN dotnet restore

# run tests on docker build
RUN dotnet test

ENV RUN_IT true

# run tests on docker run
ENTRYPOINT ["dotnet", "test", "--filter", "FullyQualifiedName~IntegrationTests"]
