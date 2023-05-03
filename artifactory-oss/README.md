#### Installing the Chart
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set postgresPassword [password] --secret
pulumi config set userPassword [password] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [password] --secret
```