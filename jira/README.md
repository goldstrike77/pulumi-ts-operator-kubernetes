#### Installing the Chart
```hcl
helm repo add atlassian-data-center https://atlassian.github.io/data-center-helm-charts
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set postgresPassword [password] --secret
pulumi config set userPassword [password] --secret
```