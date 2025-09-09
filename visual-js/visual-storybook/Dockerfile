FROM node:20 AS runner

WORKDIR app

COPY . ./

RUN npm install && npm run build --workspaces --if-present

COPY ./visual-storybook/integration-tests/ ./integration-tests/

WORKDIR integration-tests

RUN npm install && npx playwright install --with-deps chromium

ENTRYPOINT ["npm", "run", "test-storybook:ci"]
