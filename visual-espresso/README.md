# Sauce Labs Visual for Espresso

Sauce Labs Visual for Espresso exposes Sauce Labs Visual Testing for your Android apps.

## Installation & Usage

View installation and usage instructions on the [Sauce Docs website](https://docs.saucelabs.com/visual-testing/integrations/espresso/).

## Building

Sauce Visual Java SDK uses [Gradle](https://gradle.org/).

`gradlew` binary, that is included in the source, can be used as a replacement if you don't have Maven.

You'll also need [Android command line tools](https://developer.android.com/tools/).

It can be setup either using [Android Studio](https://developer.android.com/studio) or using [homebrew](https://formulae.brew.sh/cask/android-commandlinetools).

```sh
./gradlew build
```

## Running the tests

To run the smoke test you'll need a running Android Emulator.

You can either start an emulator from Android Studio or using [command line](https://developer.android.com/studio/run/emulator-commandline).

Then you can run the smoke test using the following command. Make sure that SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables
are in place before running the test.

```sh
./gradlew connectedAndroidTest
```
