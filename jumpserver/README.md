#### Installing the Chart
```hcl
helm repo add jumpserver https://jumpserver.github.io/helm-charts
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set rootPassword [string] --secret
pulumi config set userPassword [string] --secret
```