![](https://img.shields.io/badge/pulumi-kubernetes-green.svg?logo=appveyor&style=for-the-badge)

>__Please note that the original design goal of this operator was more concerned with the testing and verification, and therefore are only suitable for testing and development purposes, SHOULD NOT BE used in production environments. The author does not guarantee the accuracy, completeness, reliability, and availability of the operator content. Under no circumstances will the author be held responsible or liable in any way for any claims, damages, losses, expenses, costs or liabilities whatsoever, including, without limitation, any direct or indirect damages for loss of profits, business interruption or loss of information.__

>__请注意，该操作员的原始设计目标更关注测试和验证，因此仅适用于测试和开发目的，不应在生产环境中使用。作者不对操作员内容之准确性、完整性、可靠性、可用性做保证。在任何情况下，作者均不对任何索赔，损害，损失，费用，成本或负债承担任何责任，包括但不限于因利润损失，业务中断或信息丢失而造成的任何直接或间接损害。__

##### Before You Begin
[Install Pulumi](https://www.pulumi.com/docs/get-started/install)

[Install TypeScript Language Runtime](https://github.com/nodesource/distributions/blob/master/README.md)

##### Stack name
Not allow slashes in the name to follow orgName/stack format at init in the S3 bucket.
Fortunately, you can create first and then rename.
```hcl
pulumi new kubernetes-typescript -n demo -s norther-metrics-server
pulumi stack rename norther/metrics-server
```