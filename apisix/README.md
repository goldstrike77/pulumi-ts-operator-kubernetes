#### Installing the Chart
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add apisix https://charts.apiseven.com
```

#### Configuration credential values.
```hcl
pulumi config set etcdPassword [password] --secret
pulumi config set dashboardPassword [password] --secret
pulumi config set adminCredentials [password] --secret
pulumi config set viewerCredentials [password] --secret
```