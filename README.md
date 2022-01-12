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
