FROM node:8.16.0-jessie AS base

ENV APP_HOME /usr/src/app/
ENV PROD_DEPS /usr/src/deps/prod/
RUN useradd -ms /bin/bash docker

FROM base AS build

USER docker

COPY --chown=docker:docker package.json package-lock.json $PROD_DEPS
COPY --chown=docker:docker client/package.json client/package-lock.json $PROD_DEPS/client/
WORKDIR $PROD_DEPS
RUN npm ci --production
WORKDIR $PROD_DEPS/client
RUN npm ci --production

COPY --chown=docker:docker package.json package-lock.json $APP_HOME
COPY --chown=docker:docker tsconfig.json $APP_HOME
WORKDIR $APP_HOME
RUN npm ci

COPY --chown=docker:docker src $APP_HOME/src/

COPY --chown=docker:docker client/package.json client/package-lock.json $APP_HOME/client/
COPY --chown=docker:docker client/webpack.config.babel.js $APP_HOME/client/
COPY --chown=docker:docker client/.babelrc $APP_HOME/client/
COPY --chown=docker:docker client/src $APP_HOME/client/src/
WORKDIR $APP_HOME/client
RUN npm ci

WORKDIR $APP_HOME

RUN npm run build-all-production

FROM build as test

USER root

RUN apt-get update -y \
  && apt-get install libgtk2.0-0 -y \
  libnotify-dev \
  libgconf-2-4 \
  libnss3 \
  libxss1 \
  libasound2 \
  xvfb \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/

USER docker

COPY --chown=docker:docker cypress.json $APP_HOME/
COPY --chown=docker:docker cypress $APP_HOME/cypress
COPY --chown=docker:docker client/.jestrc.json $APP_HOME/client
COPY --chown=docker:docker .eslintrc.js $APP_HOME/client
COPY --chown=docker:docker client/.eslintrc.js $APP_HOME/client

WORKDIR $APP_HOME

FROM base as release

USER docker
WORKDIR $APP_HOME
ENV NODE_PATH $APP_HOME/build

COPY --from=build --chown=docker:docker $PROD_DEPS/node_modules $APP_HOME/node_modules/
COPY --from=build --chown=docker:docker $PROD_DEPS/client/node_modules $APP_HOME/client/node_modules/
COPY --from=build --chown=docker:docker $APP_HOME/client/build $APP_HOME/client/build/
COPY --from=build --chown=docker:docker $APP_HOME/build $APP_HOME/build
COPY --from=build --chown=docker:docker $APP_HOME/package.json $APP_HOME/package.json

HEALTHCHECK --interval=15s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["npm", "start"]
