#### Installing the Chart
```hcl
helm repo add mariadb-operator https://mariadb-operator.github.io/mariadb-operator
```

#### Configuration credential values.
```hcl
pulumi config set AWS_ACCESS_KEY_ID [password] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [password] --secret
```