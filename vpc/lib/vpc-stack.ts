import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';

export class VpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'VpcQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // VPC Flow Logs
    const vpcFlowLogs = new logs.LogGroup(this, 'VpcFlowLogs', {
      logGroupName: '/demo/flowlogs/',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

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
        // {
        //   cidrMask: 24,
        //   name: 'IsolatedSubnet',
        //   subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        // },
      ],
      flowLogs: {
        cloudwatch: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogs),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // Add tags to the VPC
    cdk.Tags.of(vpc).add('Environment', 'Production');
    cdk.Tags.of(vpc).add('Project', 'Demo');

    // Optionally, add tags to subnets
    vpc.publicSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add('Name', `Public-Subnet-${index + 1}`);
    });

    vpc.privateSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add('Name', `Private-Subnet-${index + 1}`);
    });

    // vpc.isolatedSubnets.forEach((subnet, index) => {
    //   cdk.Tags.of(subnet).add('Name', `Isolated-Subnet-${index + 1}`);
    // });

  }
}
