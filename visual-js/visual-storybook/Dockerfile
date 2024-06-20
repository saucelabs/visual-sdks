FROM node:18 AS runner

WORKDIR app

COPY tsconfig.prod.json .
COPY tsconfig.json .
COPY package.json .

COPY ./visual-storybook/src ./visual-storybook/src
COPY ./visual-storybook/package.json ./visual-storybook/package.json
COPY ./visual-storybook/tsconfig.json ./visual-storybook/tsconfig.json

RUN npm install --workspace=visual-storybook
RUN npm run build --workspace=visual-storybook

COPY ./visual-storybook/integration-tests/src ./integration-tests/src
COPY ./visual-storybook/integration-tests/.storybook ./integration-tests/.storybook

COPY ./visual-storybook/integration-tests/package.json ./integration-tests/package.json
COPY ./visual-storybook/integration-tests/package-lock.json ./integration-tests/package-lock.json
COPY ./visual-storybook/integration-tests/test-runner-jest.config.js ./integration-tests/test-runner-jest.config.js
COPY ./visual-storybook/integration-tests/tsconfig.json ./integration-tests/tsconfig.json

WORKDIR integration-tests

RUN npm install
RUN npx playwright install --with-deps

ENTRYPOINT ["npm", "run", "test-storybook:ci"]