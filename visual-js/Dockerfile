FROM node:18-alpine3.18 as build

RUN corepack enable # required for yarn to update itself on `yarn install`

# https://github.com/parcel-bundler/parcel/issues/6880
RUN apk add --no-cache python3 make g++ npm

RUN mkdir -p /workspace/clients
WORKDIR /workspace/clients

COPY package.json package.json
COPY yarn.lock yarn.lock
COPY .yarnrc.yml .yarnrc.yml
COPY .yarn .yarn

COPY tsconfig.json tsconfig.json
COPY tsconfig.prod.json tsconfig.prod.json

###############################################################################
#
# Dependencies and versioning
#
###############################################################################

RUN mkdir -p ./visual
RUN mkdir -p ./visual-wdio

COPY visual/package.json visual/package.json
COPY visual-cypress/package.json visual-cypress/package.json
COPY visual-cypress-example/package.json visual-cypress-example/package.json
COPY visual-nightwatch/package.json visual-nightwatch/package.json
COPY visual-nightwatch-example/package.json visual-nightwatch-example/package.json
COPY visual-storybook/package.json visual-storybook/package.json
COPY visual-wdio/package.json visual-wdio/package.json
COPY visual-wdio-example/package.json visual-wdio-example/package.json

ARG VERSION=0.0.1
RUN yarn install --immutable 
RUN (cd visual && yarn version $VERSION)
RUN (cd visual-cypress && yarn version $VERSION)
RUN (cd visual-nightwatch && yarn version $VERSION)
RUN (cd visual-storybook && yarn version $VERSION)
RUN (cd visual-wdio && yarn version $VERSION)

###############################################################################
#
# JS BUILD
#
###############################################################################

WORKDIR /workspace/clients/visual

COPY visual/README.md .
COPY visual/.eslintrc.cjs .
COPY visual/.gitignore .
COPY visual/.prettierrc .
COPY visual/codegen.ts .
COPY visual/jest.config.cjs .
COPY visual/schema ./schema
COPY visual/src ./src
COPY visual/tsconfig.json .

# Check that generated types match comitted version
RUN \
    mv src/graphql/__generated__ src/graphql/__generated__.orig && \
    yarn gen && \
    diff src/graphql/__generated__ src/graphql/__generated__ && \
    rm -r src/graphql/__generated__.orig

RUN sed -i "s#PKG_VERSION#${VERSION}#" ./src/api.ts
RUN yarn lint
RUN yarn build

###############################################################################
#
# JS-CYPRESS BUILD
#
###############################################################################

WORKDIR /workspace/clients/visual-cypress

COPY visual-cypress/README.md .
COPY visual-cypress/.eslintrc.cjs .
COPY visual-cypress/.gitignore .
COPY visual-cypress/.prettierrc .
COPY visual-cypress/src ./src
COPY visual-cypress/tsconfig.json .

RUN sed -i "s#PKG_VERSION#${VERSION}#" ./src/index.ts

RUN yarn lint
RUN yarn build

###############################################################################
#
# JS-NIGHTWATCH BUILD
#
###############################################################################

WORKDIR /workspace/clients/visual-nightwatch

COPY visual-nightwatch/README.md .
COPY visual-nightwatch/.eslintrc.js .
COPY visual-nightwatch/.gitignore .
COPY visual-nightwatch/.prettierrc .
COPY visual-nightwatch/nightwatch ./nightwatch
COPY visual-nightwatch/types ./types
COPY visual-nightwatch/utils ./utils
COPY visual-nightwatch/index.js ./index.js

RUN sed -i "s#PKG_VERSION#${VERSION}#" ./utils/constants.js

RUN yarn lint

###############################################################################
#
# VISUAL-STORYBOOK BUILD
#
###############################################################################

WORKDIR /workspace/clients/visual-storybook

COPY visual-storybook/.eslintrc.cjs .
COPY visual-storybook/.gitignore .
COPY visual-storybook/.prettierrc .
COPY visual-storybook/src ./src
COPY visual-storybook/tsconfig.json .
COPY visual-storybook/README.md .
COPY visual-storybook/jest.config.js .

RUN sed -i "s#PKG_VERSION#${VERSION}#" ./src/api.ts

RUN yarn lint
RUN yarn build


###############################################################################
#
# JS-WDIO BUILD
#
###############################################################################

WORKDIR /workspace/clients/visual-wdio

COPY visual-wdio/README.md .
COPY visual-wdio/.eslintrc.cjs .
COPY visual-wdio/.gitignore .
COPY visual-wdio/.prettierrc .
COPY visual-wdio/src ./src
COPY visual-wdio/tsconfig.json .
COPY visual-wdio/tsconfig.build.json .
COPY visual-wdio/jest.config.js .

RUN sed -i "s#PKG_VERSION#${VERSION}#" ./src/SauceVisualService.ts

RUN yarn lint
RUN yarn build

###############################################################################
#
# Cypress Testing
#
###############################################################################

FROM cypress/included:13.6.1 as cypress-test

COPY --from=build /workspace/clients /workspace/clients

# CJS TEST
WORKDIR /workspace/clients/visual-cypress
COPY ./visual-cypress/test-cjs.cjs ./
RUN yarn test:cjs

# Integration test
ARG SAUCE_USERNAME
ARG SAUCE_ACCESS_KEY

WORKDIR /workspace/clients/visual-cypress-example
COPY visual-cypress-example/cypress ./cypress/
COPY visual-cypress-example/package.json .
COPY visual-cypress-example/cypress.config.ts .
COPY visual-cypress-example/tsconfig.json .

RUN npx cypress install
RUN yarn cypress

###############################################################################
#
# Nightwatch Example
#
###############################################################################

FROM build as nightwatch-test

ARG SAUCE_USERNAME
ARG SAUCE_ACCESS_KEY

COPY --from=build /workspace/clients /workspace/clients

WORKDIR /workspace/clients/visual-nightwatch-example
COPY visual-nightwatch-example/nightwatch ./nightwatch/
COPY visual-nightwatch-example/pages ./pages/
COPY visual-nightwatch-example/test ./test/
COPY visual-nightwatch-example/package.json .
COPY visual-nightwatch-example/nightwatch.conf.js .
COPY visual-nightwatch-example/tsconfig.json .

RUN yarn test.web.prod-us-west-1

###############################################################################
#
# Storybook Testing
#
###############################################################################

FROM build as storybook-test

# Unit Test
WORKDIR /workspace/clients/visual-storybook
RUN yarn test


###############################################################################
#
# WDIO Testing
#
###############################################################################

FROM build as wdio-test

# Unit testing
WORKDIR /workspace/clients/visual-wdio
RUN yarn test

# Integration testing
ARG SAUCE_USERNAME
ARG SAUCE_ACCESS_KEY

COPY --from=build /workspace/clients /workspace/clients

WORKDIR /workspace/clients/visual-wdio-example
COPY visual-wdio-example/tests ./tests
COPY visual-wdio-example/tsconfig.json ./tsconfig.json

RUN yarn sauce-visual

###############################################################################
#
# RELEASE
#
###############################################################################

FROM build as release

RUN  --mount=type=secret,id=npmregistrytoken,dst=/etc/npmregistrytoken \
     echo "npmAuthToken: \"$(cat /etc/npmregistrytoken)\"" >> /workspace/.yarnrc.yml

WORKDIR /workspace/clients/visual
RUN yarn npm publish

WORKDIR /workspace/clients/visual-cypress
RUN yarn npm publish

WORKDIR /workspace/clients/visual-nightwatch
RUN yarn npm publish

WORKDIR /workspace/clients/visual-storybook
RUN yarn npm publish

WORKDIR /workspace/clients/visual-wdio
RUN yarn npm publish
