import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    aws_s3,
    aws_cloudfront,
    aws_cloudfront_origins,
    aws_s3_deployment,
    CfnOutput,
    RemovalPolicy
} from "aws-cdk-lib";

const PATH = "./build";

export class DeploymentService {
    constructor(scope: Construct, id: string) {
        const hostingBucket = new aws_s3.Bucket(
            scope,
            "FrontendBucket",
            {
              blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
              autoDeleteObjects: true,
              removalPolicy: RemovalPolicy.DESTROY
            }
          );

          const distribution = new aws_cloudfront.Distribution(
            scope,
            "CloudfrontDistribution",
            {
              defaultBehavior: {
                origin: new aws_cloudfront_origins.S3Origin(hostingBucket),
                // TODO which option is best to replace deprecated method ?
                // origin: new aws_cloudfront_origins.S3StaticWebsiteOrigin(hostingBucket),
                // origin: aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(hostingBucket),
                viewerProtocolPolicy:
                  aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
              },
              defaultRootObject: "index.html",
              errorResponses: [
                {
                  httpStatus: 404,
                  responseHttpStatus: 200,
                  responsePagePath: "/index.html",
                },
              ],
            }
          );

          new aws_s3_deployment.BucketDeployment(scope, "BucketDeployment", {
            sources: [aws_s3_deployment.Source.asset(PATH)],
            destinationBucket: hostingBucket,
            distribution,
            distributionPaths: ["/*"],
          });

          new CfnOutput(scope, "CloudFrontURL", {
            value: distribution.domainName,
            description: "The distribution URL",
            exportName: "CloudfrontURL",
          });

          new CfnOutput(scope, "BucketName", {
            value: hostingBucket.bucketName,
            description: "The name of the S3 bucket",
            exportName: "BucketName",
          });
    }
}
