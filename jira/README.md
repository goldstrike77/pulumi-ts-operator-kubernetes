#### Installing the Chart
```hcl
helm repo add atlassian-data-center https://atlassian.github.io/data-center-helm-charts
```

#### Configuration credential values.
```hcl
pulumi config set rootPassword [password] --secret
pulumi config set userPassword [password] --secret
```