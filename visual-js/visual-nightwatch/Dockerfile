FROM node:18 AS runner

WORKDIR app

COPY tsconfig.prod.json tsconfig.json package.json ./

COPY ./visual-nightwatch/src ./visual-nightwatch/src
COPY ./visual-nightwatch/package.json ./visual-nightwatch/tsconfig.json ./visual-nightwatch

RUN npm install --save-dev @tsconfig/node18
RUN npm install --workspace=visual-nightwatch
RUN npm run build --workspace=visual-nightwatch

COPY ./visual-nightwatch/integration-tests/nightwatch ./integration-tests/nightwatch

COPY ./visual-nightwatch/integration-tests/nightwatch.conf.js \
     ./visual-nightwatch/integration-tests/package.json \
    ./visual-nightwatch/integration-tests/tsconfig.json \
    ./integration-tests/

WORKDIR integration-tests

RUN npm install

ENTRYPOINT ["npm", "run", "login-test"]