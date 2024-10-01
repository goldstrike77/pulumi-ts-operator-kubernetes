#### Installing the Chart
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add gitlab https://charts.gitlab.io
```

#### Configuration credential values.
```hcl
pulumi config set ROOT-PASSWORD [password] --secret
pulumi config set PSQL-PASSWORD [password] --secret
pulumi config set AWS_ACCESS_KEY [accesskey] --secret
pulumi config set AWS_SECRET_KEY [secreykey] --secret
```

tj@VH9ECytRF