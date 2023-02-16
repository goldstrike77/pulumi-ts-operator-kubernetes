#### Installing the Chart.
```hcl
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set adminPassword [password] --secret
pulumi config set rootPassword [password] --secret
pulumi config set userPassword [password] --secret
```