FROM node:18 AS runner

WORKDIR app

RUN corepack enable

COPY . ./

RUN yarn install && npm run build --workspaces --if-present

COPY ./visual-playwright/integration-tests/ ./integration-tests/

WORKDIR integration-tests

RUN npm install && npx playwright install --with-deps chromium

ENTRYPOINT ["npm", "run", "sauce-visual"]
