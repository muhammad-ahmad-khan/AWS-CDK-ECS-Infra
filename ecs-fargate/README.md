# ECS Fargate Deployment with AWS CDK

This project provisions an ECS Fargate service with the following components:
- **Amazon ECS (Fargate)**: A serverless container service.
- **Amazon ECR**: A container registry for storing Docker images.
- **Application Load Balancer (ALB)**: Distributes incoming traffic to the Fargate tasks.
- **Autoscaling**: Dynamically adjusts the number of tasks based on CPU and memory utilization.
- **ECS Exec**: Provides the ability to execute commands inside running containers for debugging.

## Prerequisites

Before deploying, ensure the following prerequisites are met:

1. **AWS CDK Installed**  
   Install AWS CDK globally:
   ```bash
   npm install -g aws-cdk
   ```

2. **AWS CLI Configured**  
   Set up the AWS CLI with your credentials:
   ```bash
   aws configure
   ```

3. **Node.js Installed**  
   Install Node.js (LTS version recommended). Verify installation:
   ```bash
   node --version
   npm --version
   ```

4. **Required Parameters**  
   You must provide the following parameters for deployment:

   1. **VPC ID**  
      An existing VPC ID where the ECS service will be deployed.

   2. **ECR Repository Name**  
      The name of the Amazon Elastic Container Registry (ECR) repository where your application images will be stored.

   3. **ACM Certificate ARN**  
      The ARN of the AWS Certificate Manager (ACM) certificate used to enable HTTPS.

   4. **Secret ARN**  
      The ARN of the AWS Secrets Manager secret used for the `demo-service` application.

   Ensure all these parameters are correctly configured before initiating the deployment process.

---

## Getting Started

### Step 1: Install Dependencies
Install the required Node.js dependencies:
```bash
cd ecs-fargate
npm install
```

### Step 2: Bootstrap the CDK
Run the bootstrap command to set up resources needed for AWS CDK in your account:
```bash
cdk bootstrap --profile demo-account
```
`Note: This is only required once in AWS account.`

### Step 3: Synthesize the Stack
Synthesize the CloudFormation template to verify the stack:
```bash

cdk synth --context vpcId=vpc-0123456789abcdefgh --context ecrRepositoryName=demo-service --context acmCertificateArn=arn:aws:acm:us-east-1:012345678910:certificate/1140c09e-e36c-418e-840b-38fcfaf1c9ff --context demoServiceSecretArn=arn:aws:secretsmanager:us-east-1:012345678910:secret:prod/demo-service-ab12YZ --profile demo-account
```

### Step 4: Deploy the Stack
Deploy the CDK stack to AWS:
```bash

cdk deploy --context vpcId=vpc-0123456789abcdefgh --context ecrRepositoryName=demo-service --context acmCertificateArn=arn:aws:acm:us-east-1:012345678910:certificate/1140c09e-e36c-418e-840b-38fcfaf1c9ff --context demoServiceSecretArn=arn:aws:secretsmanager:us-east-1:012345678910:secret:prod/demo-service-ab12YZ --profile demo-account

cdk deploy --context vpcId=vpc-0123456789abcdefgh --context ecrRepositoryName=demo-service --context acmCertificateArn=arn:aws:acm:us-east-1:012345678910:certificate/1140c09e-e36c-418e-840b-38fcfaf1c9ff --context demoServiceSecretArn=arn:aws:secretsmanager:us-east-1:012345678910:secret:prod/demo-service-ab12YZ --require-approval never --profile demo-account
```

## Debugging with ECS Exec

To execute commands inside a running container, use the following command:
```bash
aws ecs execute-command \
  --cluster demo-service-EcsFargateCluster \
  --task <task-id> \
  --container AppContainer \
  --command "/bin/sh" \
  --interactive \
  --profile demo-account
```

## Cleanup

To remove all resources created by this stack:
```bash
cdk destroy --profile demo-account
```

## Notes

- Ensure your Docker image is pushed to the ECR repository before deploying the stack.
- The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
