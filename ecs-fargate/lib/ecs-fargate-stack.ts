import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface EcsFargateStackProps extends cdk.StackProps {
  vpcId: string; // VPC Id
  ecrRepositoryName: string; // ECR repository name
  acmCertificateArn: string; // ACM certificate ARN for HTTPS
  demoServiceSecretArn: string; // Secret ARN for demoService
}

export class EcsFargateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcsFargateStackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // Lookup existing VPC using VPC ID from props
    const vpc = ec2.Vpc.fromLookup(this, 'EcsVpc', {
      vpcId: props.vpcId,
    });

    // // ECR Repository
    // const ecrRepo = new ecr.Repository(this, 'EcsRepository', {
    //   repositoryName: 'demo-service',
    // });

    // Reference the existing ECR repository
    const ecrRepo = ecr.Repository.fromRepositoryName(this, 'ExistingEcrRepository', props.ecrRepositoryName);

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      clusterName: 'demo-service-EcsFargateCluster',
      vpc,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'FargateTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // Reference the secret from AWS Secrets Manager to be used in the task definition
    const taskSecret = secretsmanager.Secret.fromSecretCompleteArn(this, 'FargateTaskSecret', props.demoServiceSecretArn);

    // Add a container to the task definition
    const container = taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo, 'latest'),
      logging: ecs.LogDriver.awsLogs({ streamPrefix: 'ecs-app' }),
      environment: {
        DEBUG: 'true', // Simple environment variable
      },
      secrets: {
        SECRET_KEY: ecs.Secret.fromSecretsManager(taskSecret, 'SECRET_KEY'), // Referencing secret for SECRET_KEY
      },
    });

    container.addPortMappings({
      containerPort: 5000, // Container runs on port 5000
    });

    // ACM Certificate for HTTPS
    const certificate = acm.Certificate.fromCertificateArn(this, 'AcmCertificate', props.acmCertificateArn);

    // Application Load Balanced Fargate Service
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'FargateService', {
      cluster,
      taskDefinition,
      enableExecuteCommand: true, // Enable execute command
      certificate,
      publicLoadBalancer: true,
      loadBalancerName: 'demo-service-alb',
      sslPolicy: elbv2.SslPolicy.RECOMMENDED,
      serviceName: 'demo-service-EcsFargateService',
      redirectHTTP: true,
      protocol: elbv2.ApplicationProtocol.HTTPS, // Default HTTPS
    });

    // Adjust target group port to match the container port
    fargateService.targetGroup.configureHealthCheck({
      path: '/',
      port: '5000', // Health check targets container port 5000
    });

    // Autoscaling
    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 80,
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: fargateService.service.serviceName,
      description: 'ECS Service Name',
    });

  }
}
