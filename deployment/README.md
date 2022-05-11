# Building playground Docker image
You should set the `DEPLOYMENT_ID` environment variable to a unique identifier that will be used when running these prereqs and when building the playground image.

On Github, you can easily make this with the following snippet in your action's `.yml` file:
```
env:
  DEPLOYMENT_ID: ${{ github.run_id }}.${{ github.run_attempt }}
```

## Prereqs
This ties a particular Docker image of the playground to Docker images of the Rust toolchains, allowing them to all deploy as an immutable atomic unit.

To build a docker image containing the playground, you must first do the following:
1. Build the UI frontend (i.e. `cd ui/frontend`, `yarn install`, `yarn build`)
2. Build the UI service (i.e. `cd ui`, `cargo build --release`)
3. Build docker images for tools you want to host in your playground (default is everything). I.e. `cd compiler`, `./build.sh`. Your toolchain images will get tagged with `$DEPLOYMENT_ID`.

## Building the playground Docker image
After running prerequisites, do the following in the root of the `rust-playground` enlistment:

1. `docker build -t $DEPLOYMENT_ID --build-arg docker_repo=<My docker username> --build-arg deployment_id=$DEPLOYMENT_ID -f deployment/Dockerfile .`

Replace `<My docker username>` with the desired DockerHub username.

You may optionally scope down the set of tools you wish to use in your playground with the `tools` argument. For example, if you customize your playground to not include `miri`, `fmt`, and `clippy`, you can specify `--build-arg tools="rust-stable rust-beta rust-nightly"`. This will speed up application startup and deployment.

## Notes
The playground docker image uses Docker-in-Docker to run user programs inside containers inside the playground container. This requires the `--privileged` flag when running the container.

# Running the image
Once you've compiled your playground Docker image, you can run it locally with `docker run -p 5000:5000 --privileged $DEPLOYMENT_ID`. When the container first starts, it will fetch the Rust toolchain images tagged with `$DEPLOYMENT_ID` and then start the UI.

# Deployment and application notes
By putting the playground in a Docker container, you can deploy it to Elastic Beanstalk configured to run Docker containers. The `deploy.sh` script will create a new application version (i.e. a deployment configuration) and update the specified environment. Before running this script, you need to set the following environment variables:

* `DEPLOYMENT_ID`: The unique id of the deployment and the tag to use for all the docker images. This must match the id you used when building the playground and toolchain images.
* `DOCKER_USER`: The username under which the `playground` and toolchain (`rust-stable`, `rust-beta`, etc.) images reside. Each image should have a tag matching `$DEPLOYMENT_ID`.
* `ENVIRONMENT_ID`: The ID of the Elastic Beanstalk application environment. Not it's name, but the id (e.g. `e-abcdefghij`).
* `S3_BUCKET`: This is the S3 bucket where application version configuration files get uploaded. Creating an Elastic Beanstalk application automatically creates this bucket. Don't include the `s3://` prefix or a trailing `/`.
* `AWS_DEFAULT_REGION`: The region where your Elastic Beanstalk deployment resides.
* `AWS_ACCESS_KEY_ID`: The name of a secret key associated with an IAM user that manges your service.
* `AWS_SECRET_ACCESS_KEY`: The IAM user's secret for `AWS_ACCESS_KEY_ID`. *This must remain secret and not appear anywhere public (i.e. checked in to Git, on a fileshare, etc)!* On Github, you can add a secret named `MY_SECRET_ID` to your repo under `Settings > Security > Secrets > Actions`. You then would reference it in your workflow as follows:

```
env:
    ...
    AWS_SECRET_ACCESS_KEY: ${{ secrets.MY_SECRET_ID }}
```