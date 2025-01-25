# AWS VPC Stack using AWS CDK TypeScript 

This is a VPC stack project using AWS CDK in TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

### Step 1: Set Up Your CDK Project

1. **Install AWS CDK CLI** (if you haven't already):
   ```bash
   npm install -g aws-cdk
   ```

2. **Initialize a New CDK Project**:
   ```bash
   mkdir vpc
   cd vpc
   cdk init app --language typescript
   ```

   This command sets up a new CDK project with a TypeScript configuration.

### Step 2: Install Required AWS CDK Packages

To create a VPC, install the `aws-cdk-lib` and `constructs` modules:
   ```bash
   npm install aws-cdk-lib constructs
   ```

### Step 3: Create the VPC Stack

1. **Navigate to `lib` directory** and open the file that was created, usually named `vpc-stack.ts`.
   
2. **Define the VPC in the Stack**. Replace the content with the following example:

   ```typescript
   import { Stack, StackProps, Tags } from 'aws-cdk-lib';
   import { Construct } from 'constructs';
   import * as ec2 from 'aws-cdk-lib/aws-ec2';

   export class VpcStack extends Stack {
     constructor(scope: Construct, id: string, props?: StackProps) {
       super(scope, id, props);

       // Create a VPC
       const vpc = new ec2.Vpc(this, 'Vpc', {
         maxAzs: 3, // Maximum number of availability zones
         cidr: "10.0.0.0/16", // CIDR range for VPC
         natGateways: 1, // Number of NAT Gateways
         subnetConfiguration: [
           {
             cidrMask: 24,
             name: 'PublicSubnet',
             subnetType: ec2.SubnetType.PUBLIC,
           },
           {
             cidrMask: 24,
             name: 'PrivateSubnet',
             subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
           },
           {
             cidrMask: 24,
             name: 'IsolatedSubnet',
             subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
           },
         ],
       });

        // Add tags to the VPC
        Tags.of(vpc).add('Environment', 'Production');
        Tags.of(vpc).add('Project', 'MyProjectName');

        // Optionally, add tags to subnets
        vpc.publicSubnets.forEach((subnet, index) => {
            Tags.of(subnet).add('Name', `PublicSubnet-${index + 1}`);
        });

        vpc.privateSubnets.forEach((subnet, index) => {
            Tags.of(subnet).add('Name', `PrivateSubnet-${index + 1}`);
        });

        vpc.isolatedSubnets.forEach((subnet, index) => {
            Tags.of(subnet).add('Name', `IsolatedSubnet-${index + 1}`);
        });

     }
   }
   ```

### Step 4: Configure the `bin` File

In your `bin/vpc.ts` file, ensure you’re initializing the stack like so:

```typescript
#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';

const app = new App();
new VpcStack(app, 'VpcStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
```

### Step 5: Prepare AWS environment for CDK deployment (AWS CDK bootstrapping)

Bootstrapping is the process of preparing your AWS environment for usage with the AWS Cloud Development Kit (AWS CDK). Before you deploy a CDK stack into an AWS environment, the environment must first be bootstrapped.

```bash
  cdk bootstrap --profile demo-account
```

`Note: This is only required once in AWS account.`

### Step 6: Deploy the Stack

1. **Synthesize** the CloudFormation template to verify the stack:
   ```bash
   cdk synth --profile demo-account
   ```

2. **Deploy** the stack to AWS:
   ```bash
   cdk deploy --profile demo-account
   ```

### Step 7: Verify and Clean Up

- Once deployed, you can view the VPC in the AWS Management Console under the VPC service.
- To delete the stack, run:
  ```bash
  cdk destroy --profile demo-account
  ```