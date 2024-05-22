FROM node:18 AS runner

COPY ./integration-tests/configs ./configs
COPY ./integration-tests/helpers ./helpers
COPY ./integration-tests/pages ./pages
COPY ./integration-tests/specs ./specs

COPY ./integration-tests/package.json ./
COPY ./integration-tests/tsconfig.json ./

RUN npm install

ENTRYPOINT ["npm", "run", "login-test"]
