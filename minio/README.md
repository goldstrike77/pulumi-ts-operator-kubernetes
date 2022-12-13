#### Installing the Chart
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set superPassword [password] --secret
pulumi config set readonlyPassword [password] --secret
pulumi config set rootPassword [password] --secret
pulumi config set thanosPassword [password] --secret
pulumi config set lokiPassword [password] --secret
pulumi config set tempoPassword [password] --secret
pulumi config set backupPassword [password] --secret
pulumi config set gitlabPassword [password] --secret
```

#### Print minio accesskey and secretkey.
```hcl
kubectl get secret --namespace minio minio -o jsonpath="{.data.root-user}" | base64 --decode
kubectl get secret --namespace minio minio -o jsonpath="{.data.root-password}" | base64 --decode
```