#### Installing the Chart
```hcl
helm repo add grafana https://grafana.github.io/helm-charts
```

#### Configuration credential values.
```hcl
pulumi config set AWS_ACCESS_KEY_ID [string] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [string] --secret
```