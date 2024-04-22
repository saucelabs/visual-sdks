# Running the tests locally

Go to the folder of the SDK and build the container image using Docker.

```sh
docker build -t __SDK_IMAGE_NAME__ .
```

Go to tests folder and install the dependencies

```sh
npm ci
```

Set the required environment variables

```sh
export SAUCE_USERNAME=__YOUR_SAUCE_USERNAME__
export SAUCE_ACCESS_KEY=__YOUR_SAUCE_ACCESS_KEY__
export CONTAINER_IMAGE_NAME=__SDK_IMAGE_NAME__
```

Run the tests

```sh
npm run test
```
