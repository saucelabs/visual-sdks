FROM cypress/included:latest AS runner

WORKDIR app

COPY package.json .

COPY ./visual-cypress/src ./visual-cypress/src
COPY ./visual-cypress/tsconfig.json ./visual-cypress/tsconfig.json
COPY ./visual-cypress/package.json ./visual-cypress/package.json

RUN npm install --workspace=visual-cypress
RUN npm run build --workspace=visual-cypress

COPY ./visual-cypress/integration-tests/cypress ./integration-tests/cypress
COPY ./visual-cypress/integration-tests/cypress.config.js ./integration-tests/cypress.config.js
COPY ./visual-cypress/integration-tests/package.json ./integration-tests/package.json
COPY ./visual-cypress/integration-tests/tsconfig.json ./integration-tests/tsconfig.json

WORKDIR integration-tests

RUN npm install

ENTRYPOINT ["npm", "run", "login-test"]