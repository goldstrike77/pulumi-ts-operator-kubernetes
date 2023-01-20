#### Installing the Chart
```hcl
helm repo add percona https://percona.github.io/percona-helm-charts/
```

#### Configuration credential values.
```hcl
pulumi config set backupPassword [password] --secret
pulumi config set databaseAdminPassword [password] --secret
pulumi config set clusterAdminPassword [password] --secret
pulumi config set clusterMonitorPassword [password] --secret
pulumi config set userAdminPassword [password] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [password] --secret
```