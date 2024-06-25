FROM node:18 AS runner

WORKDIR app

COPY tsconfig.prod.json .
COPY tsconfig.json .
COPY package.json .

COPY ./visual-nightwatch/src ./visual-nightwatch/src
COPY ./visual-nightwatch/package.json ./visual-nightwatch/package.json
COPY ./visual-nightwatch/tsconfig.json ./visual-nightwatch/tsconfig.json

RUN npm install --save-dev @tsconfig/node18
RUN npm install --workspace=visual-nightwatch
RUN npm run build --workspace=visual-nightwatch

COPY ./visual-nightwatch/integration-tests/nightwatch ./integration-tests/nightwatch
COPY ./visual-nightwatch/integration-tests/nightwatch.conf.js ./integration-tests/nightwatch.conf.js
COPY ./visual-nightwatch/integration-tests/package.json ./integration-tests/package.json
COPY ./visual-nightwatch/integration-tests/tsconfig.json ./integration-tests/tsconfig.json

WORKDIR integration-tests

RUN npm install

ENTRYPOINT ["npm", "run", "login-test"]