#### Installing the Chart
```hcl
helm repo add vsphere-cpi https://kubernetes.github.io/cloud-provider-vsphere
```

#### Configuration credential values.
```hcl
pulumi config set VSPHERE_PASSWORD [string] --secret
```