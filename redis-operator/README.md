#### Installing the Chart
```hcl
helm repo add ot-helm https://ot-container-kit.github.io/helm-charts
```

#### Configuration credential values.
```hcl
pulumi config set AWS_ACCESS_KEY_ID [AWS_ACCESS_KEY_ID] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [AWS_SECRET_ACCESS_KEY] --secret
```