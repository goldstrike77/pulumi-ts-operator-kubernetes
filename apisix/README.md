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

##### @param initialClusterState Initial cluster state. Allowed values: 'new' or 'existing'
#####   - 'new': when installing the chart ('helm install ...')
#####   - 'existing': when upgrading the chart ('helm upgrade ...')