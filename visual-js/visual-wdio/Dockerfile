FROM node:18 AS runner

WORKDIR app

COPY tsconfig.prod.json .
COPY tsconfig.json .
COPY package.json .

COPY ./visual/src ./visual/src
COPY ./visual/package.json ./visual/package.json
COPY ./visual/tsconfig.json ./visual/tsconfig.json
COPY ./visual-wdio/src ./visual-wdio/src
COPY ./visual-wdio/package.json ./visual-wdio/package.json
COPY ./visual-wdio/tsconfig.json ./visual-wdio/tsconfig.json
COPY ./visual-wdio/tsconfig.build.json ./visual-wdio/tsconfig.build.json

RUN npm install --workspace=visual
RUN npm run build --workspace=visual
RUN npm install --workspace=visual-wdio
RUN npm run build --workspace=visual-wdio

COPY ./visual-wdio/integration-tests/configs ./integration-tests/configs
COPY ./visual-wdio/integration-tests/helpers ./integration-tests/helpers
COPY ./visual-wdio/integration-tests/pages ./integration-tests/pages
COPY ./visual-wdio/integration-tests/specs ./integration-tests/specs

COPY ./visual-wdio/integration-tests/package.json ./integration-tests/package.json

WORKDIR integration-tests

RUN npm install

ENTRYPOINT ["npm", "run", "login-test"]
