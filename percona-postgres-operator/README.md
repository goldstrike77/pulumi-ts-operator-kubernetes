#### Installing the Chart
```hcl
helm repo add percona https://percona.github.io/percona-helm-charts
```

#### Configuration credential values.
```hcl
pulumi config set AWS_ACCESS_KEY_ID [password] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [password] --secret
pulumi config set adminPassword [password] --secret
```