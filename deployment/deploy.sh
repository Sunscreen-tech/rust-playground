#! /bin/bash
set -euv -o pipefail

if [ -z ${DOCKER_USER} ]
then
    echo "DOCKER_USER not set. This is the user prefix for the playground container name (e.g. docker_user/playground:12345)."
    exit 1
fi

if [ -z ${DEPLOYMENT_ID} ]
then
    echo "DEPLOYMENT_ID not set. This is the tag for the playground image to use."
    exit 1
fi

if [ -z ${ENVIRONMENT_ID} ]
then
    echo "Elastic Beanstalk application environment ENVIRONMENT_ID not set. This is where the playground gets deployed."
    exit 1
fi

if [ -z ${S3_BUCKET} ]
then
    echo "S3_BUCKET not set. This is where EB application configurations get uploaded."
    exit 1
fi

if [ -z ${AWS_DEFAULT_REGION} ]
then
    echo "AWS_DEFAULT_REGION is not set. This is the region to deploy your application to EBS"
    exit 1
fi

if [ -z ${AWS_SECRET_ACCESS_KEY} ]
then
    echo "AWS_SECRET_ACCESS_KEY is not set. This is the secret key used to authenticate aws commands.."
    exit 1
fi

if [ -z ${AWS_ACCESS_KEY_ID} ]
then
    echo "AWS_ACCESS_KEY_ID is not set. This is the name of the key to use for authentication."
    exit 1
fi

image_name="$DOCKER_REGISTRY/playground:$DEPLOYMENT_ID"
config_file=$DEPLOYMENT_ID-Dockerrun.aws.json

echo $image_name

cat Dockerrun.aws.json.template | sed -e "s@\$image_name@${image_name}@" > $config_file

aws s3 mv $config_file s3://$S3_BUCKET/$config_file

aws elasticbeanstalk create-application-version \
	--application-name Playground \
	--version-label $DEPLOYMENT_ID \
	--description "Deployment configuration for ID $DEPLOYMENT_ID" \
	--source-bundle S3Bucket="$S3_BUCKET",S3Key="$config_file"

aws elasticbeanstalk update-environment \
    --application-name Playground \
    --environment-id $ENVIRONMENT_ID \
    --description "Deployment for ID $DEPLOYMENT_ID" \
    --version-label $DEPLOYMENT_ID
