#### Installing the Chart
```hcl
helm repo add jfrog https://charts.jfrog.io
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set pqsqlSuperPassword [password] --secret
pulumi config set pqsqlUserPassword [password] --secret
pulumi config set S3.CONF [password] --secret
pulumi config set AWS_ACCESS_KEY_ID [password] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [password] --secret
```