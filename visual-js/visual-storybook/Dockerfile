FROM node:18 AS runner

WORKDIR app

COPY tsconfig.prod.json tsconfig.json package.json ./

COPY ./visual-storybook/src ./visual-storybook/src
COPY ./visual-storybook/package.json ./visual-storybook/tsconfig.json ./visual-storybook/

RUN npm install --workspace=visual-storybook
RUN npm run build --workspace=visual-storybook

COPY ./visual-storybook/integration-tests/src ./integration-tests/src
COPY ./visual-storybook/integration-tests/.storybook ./integration-tests/.storybook

COPY ./visual-storybook/integration-tests/package.json \
    ./visual-storybook/integration-tests/package-lock.json \
    ./visual-storybook/integration-tests/test-runner-jest.config.js \
    ./visual-storybook/integration-tests/tsconfig.json \
    ./integration-tests/

WORKDIR integration-tests

RUN npm install
RUN npx playwright install --with-deps

ENTRYPOINT ["npm", "run", "test-storybook:ci"]