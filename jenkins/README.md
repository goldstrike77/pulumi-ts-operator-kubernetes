#### Installing the Chart
```hcl
helm repo add jenkins https://charts.jenkins.io
```

#### Configuration credential values.
```hcl
pulumi config set adminPassword [password] --secret
pulumi config set AWS_ACCESS_KEY_ID [AWS_ACCESS_KEY_ID] --secret
pulumi config set adminPassAWS_SECRET_ACCESS_KEYword [AWS_SECRET_ACCESS_KEY] --secret
```