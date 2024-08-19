#### Installing the Chart
```hcl
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
```

#### Configuration credential values.
```hcl
pulumi config set bootstrapPassword [string] --secret
```