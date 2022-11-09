#### Installing the Chart.
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set rootPassword [password] --secret
pulumi config set userPassword [password] --secret
pulumi config set secretkey [changemechangeit] --secret # 大小写字母均可, 长度必须为16位。
```

#### Default authorization.
```hcl
user: admin
pass: Yearning_admin
```