FROM cypress/included:latest AS runner

WORKDIR app

COPY . ./

RUN npm install && npm run build --workspaces --if-present

WORKDIR ./visual-cypress/integration-tests

RUN npm install

ENTRYPOINT ["npm", "run", "login-test"]
