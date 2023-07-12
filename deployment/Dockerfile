FROM sunscreendeployment/ubuntu-dind

EXPOSE 5000

ARG docker_repo
RUN test -n "$docker_repo"

ARG deployment_id
RUN test -n "$deployment_id"

ARG tools=rust-stable rust-beta rust-nightly rustfmt clippy miri

RUN echo Using Docker Repo: ${docker_repo}
ENV DOCKER_REPO=${docker_repo}

RUN echo Using Deployment ID: ${deployment_id}
ENV DEPLOYMENT_ID=${deployment_id}

RUN echo Using tools: ${tools}
ENV TOOLS=${tools}
ENV RUST_LOG=INFO

ENV PLAYGROUND_UI_ROOT=/build
ENV PLAYGROUND_GITHUB_TOKEN=""
ENV PLAYGROUND_UI_ADDRESS=0.0.0.0
ENV PLAYGROUND_CORS_ENABLED=1

COPY ./compiler/fetch.sh .
COPY ./target/release/ui .
COPY ./ui/frontend/build/ ./build/
COPY ./deployment/startup.sh .

RUN chmod 755 startup.sh

ENTRYPOINT ./startup.sh
