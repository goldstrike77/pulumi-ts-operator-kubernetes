#### Installing the Chart
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set rootPassword [password] --secret
pulumi config set alertaPassword [password] --secret
pulumi config set alertaAdminPassword [password] --secret
```