#### Installing the Chart
```hcl
helm repo add longhorn https://charts.longhorn.io
```

#### Configuration credential values.
```hcl
pulumi config set AWS_ACCESS_KEY_ID [password] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [password] --secret
```