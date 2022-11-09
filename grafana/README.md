#### Installing the Chart
```hcl
helm repo add grafana https://grafana.github.io/helm-charts
```

#### Configuration credential values.
```hcl
pulumi config set adminPassword [password] --secret
```