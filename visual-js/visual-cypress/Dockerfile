FROM cypress/included:latest AS runner

WORKDIR app

RUN corepack enable

COPY . ./

RUN yarn install && npm run build --workspaces --if-present

WORKDIR ./visual-cypress/integration-tests

RUN npm install

ENTRYPOINT ["npm", "run", "login-test"]
