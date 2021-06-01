FROM node:14-alpine

# Install microdocs-core
ADD ./microdocs-core/dist/package.json ./microdocs-core/dist/.npmrc /app/@maxxton/microdocs-core/dist/
WORKDIR /app/@maxxton/microdocs-core/dist
RUN npm link

# Install microdocs-cli
WORKDIR /app/@maxxton/microdocs-cli
ADD ./microdocs-cli/package.json ./microdocs-cli/.npmrc ./
RUN npm link @maxxton/microdocs-core
RUN rm -rf /app/@maxxton/microdocs-core/dist/node_modules && npm install

# Build microdocs-server
ADD ./microdocs-core/dist /app/@maxxton/microdocs-core/dist
ADD ./microdocs-cli/src ./src
ADD ./microdocs-cli/gulpfile.js ./microdocs-cli/build.js ./
RUN ./node_modules/.bin/gulp prepublish
CMD rm -rf ./dist/* && ./node_modules/.bin/gulp watch