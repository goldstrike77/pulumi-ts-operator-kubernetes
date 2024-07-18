#### Downloading from the registry
```hcl
helm repo add harbor https://helm.goharbor.io
```

#### Configuration credential values.
```hcl
pulumi config set S3.CONF [password] --secret
pulumi config set AWS_ACCESS_KEY_ID [password] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [password] --secret
pulumi config set HARBOR_ADMIN_PASSWORD [password] --secret
```