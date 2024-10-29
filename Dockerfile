FROM node:20.11.0

ARG web=/opt/workspace/aelf-example

WORKDIR ${web}

COPY . ${web}

ARG ENVIRONMENT
RUN yarn
RUN if [ "$ENVIRONMENT" = "mainnet" ]; \
    then yarn build;\
    elif [ "$ENVIRONMENT" = "testnet" ]; \
    then yarn build-test; \
    fi
RUN rm -rf .next/cache
RUN yarn cache clean

ENTRYPOINT ["yarn", "start"]

EXPOSE 3000
