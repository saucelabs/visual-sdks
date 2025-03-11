FROM node:18 AS runner

WORKDIR app

RUN corepack enable

COPY . ./

RUN npm install && npm run build --workspaces --if-present

WORKDIR ./visual-playwright/integration-tests

RUN npm install && npx playwright install --with-deps chromium

ENTRYPOINT ["npm", "run", "sauce-visual"]
