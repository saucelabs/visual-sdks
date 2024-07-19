# Sauce Labs Visual for Java

Sauce Labs Visual for Java exposes Sauce Labs Visual Testing for your Java project with Selenium.

## Installation & Usage

View installation and usage instructions on the [Sauce Docs website](https://docs.saucelabs.com/visual-testing/integrations/java/).

## Building

Sauce Visual Java SDK uses Maven as build tool. `.mvnw` binary, that is included in the source code, can be used as a replacement if you don't have Maven installed.

```sh
./mvnw clean compile
```

## Linting

Sauce Visual Java SDK uses [fmt](https://github.com/spotify/fmt-maven-plugin) for linting.

```sh
./mvnw com.spotify.fmt:fmt-maven-plugin:format
```

## Running the tests

To run the unit tests:

```sh
./mvnw test
```
