FROM mcr.microsoft.com/dotnet/sdk:6.0

WORKDIR /app
COPY . .

RUN dotnet restore

ENV RUN_IT true

# run tests on docker run
ENTRYPOINT ["dotnet", "test", "--filter", "FullyQualifiedName~IntegrationTests"]