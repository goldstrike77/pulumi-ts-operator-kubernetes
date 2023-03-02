#### Installing the Chart
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set postgresPassword [string] --secret
pulumi config set password [string] --secret
```