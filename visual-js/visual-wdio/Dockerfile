FROM node:18 AS runner

WORKDIR app

RUN corepack enable

COPY . ./

RUN yarn install && npm run build --workspaces --if-present

WORKDIR ./visual-wdio/integration-tests

RUN npm install

ENTRYPOINT ["npm", "run", "login-test"]
