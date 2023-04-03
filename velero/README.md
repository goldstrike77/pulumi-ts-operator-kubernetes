#### Installing the Chart
```hcl
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
```

#### Configuration credential values.
```hcl
pulumi config set AWS_ACCESS_KEY_ID [string] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [string] --secret
```