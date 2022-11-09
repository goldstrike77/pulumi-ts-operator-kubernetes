#### Installing the Chart
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add gitlab https://charts.gitlab.io
```

#### Configuration credential values.
```hcl
pulumi config set postgresPassword [password] --secret
pulumi config set userPassword [password] --secret
```