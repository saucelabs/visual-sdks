# Sauce Labs Visual for Espresso

Sauce Labs Visual for Espresso exposes Sauce Labs Visual Testing for your Android apps.

## Installation & Usage

View installation and usage instructions on the [Sauce Docs website](https://docs.saucelabs.com/visual-testing/integrations/espresso/).

## Building

Sauce Visual Espresso SDK uses [Gradle](https://gradle.org/).

`gradlew` binary, that is included in the source, can be used as a replacement if you don't have Gradle.

You'll also need [Android command line tools](https://developer.android.com/tools/).

It can be installed either using [Android Studio](https://developer.android.com/studio) or using [homebrew](https://formulae.brew.sh/cask/android-commandlinetools).

Finally, the library can be built using the following command:

```sh
./gradlew build
```

## Running the tests

To run the smoke test you'll need a running Android Emulator.

You can start an emulator either from Android Studio or using [command line](https://developer.android.com/studio/run/emulator-commandline).

Make sure that SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables
are in place before running the test.

The smoke test can be run using the following command: 

```sh
./gradlew connectedAndroidTest
```
