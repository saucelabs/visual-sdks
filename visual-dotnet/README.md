# Sauce Labs Visual for C#

Sauce Labs Visual for C# expose Sauce Labs Visual Testing for your C# project with Selenium.

## Installation & Usage

View installation and usage instructions on the [Sauce Docs website](https://docs.saucelabs.com/visual-testing/integrations/csharp/).

## Building

```sh
dotnet build ./SauceLabs.Visual/SauceLabs.Visual.csproj --no-restore
```

## Linting

For linting, Sauce Visual C# SDK uses [dotnet-format](https://github.com/dotnet/sdk/tree/main/documentation/format/docs) tool. It can be installed with the following command:

```sh
dotnet tool install -g dotnet-format
```

After the installation, it can be run the following command:

```sh
dotnet format '.' --verify-no-changes
```

## Running the tests

Run all tests:
```sh
dotnet test --verbosity normal
```

Run only unit tests:
```sh
dotnet test --filter "Category=Unit" --verbosity normal
```
