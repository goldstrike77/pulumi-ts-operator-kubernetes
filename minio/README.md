#### Installing the Chart
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add minio https://operator.min.io
```

#### Configuration credential values.
```hcl
pulumi config set adminPassword [password] --secret
pulumi config set readonlyPassword [password] --secret
pulumi config set rootPassword [password] --secret
pulumi config set thanosPassword [password] --secret
pulumi config set lokiPassword [password] --secret
pulumi config set tempoPassword [password] --secret
pulumi config set backupPassword [password] --secret
pulumi config set gitlabPassword [password] --secret
pulumi config set artifactoryPassword [password] --secret
pulumi config set confluencePassword [password] --secret
```

#### Print minio operator JWT.
```hcl
kubectl -n minio get secret $(kubectl -n minio get serviceaccount console-sa -o jsonpath="{.secrets[0].name}") -o jsonpath="{.data.token}" | base64 --decode
```