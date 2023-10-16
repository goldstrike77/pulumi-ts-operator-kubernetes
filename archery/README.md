#### Installing the Chart
```hcl
helm repo add douban https://douban.github.io/charts/
```

#### Configuration credential values.
```hcl
pulumi config set AWS_ACCESS_KEY_ID [password] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [password] --secret
pulumi config set MYSQL_ROOT_PASSWORD [password] --secret
pulumi config set MYSQL_USER_PASSWORD [password] --secret
pulumi config set REDIS_PASSWORD [password] --secret
pulumi config set ARCHERY_PASSWORD [password] --secret
pulumi config set CLUSTERCHECK [password] --secret
pulumi config set MONITOR [password] --secret
pulumi config set OPERATOR [password] --secret
pulumi config set REPLICATION [password] --secret
pulumi config set XTRABACKUP [password] --secret
pulumi config set ARCHERY [password] --secret
```