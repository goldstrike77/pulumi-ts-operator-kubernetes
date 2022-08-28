#### Configuration credential values.
```hcl
pulumi config set rootPassword [password] --secret
```

#### Print minio accesskey and secretkey.
```hcl
kubectl get secret --namespace minio minio -o jsonpath="{.data.root-user}" | base64 --decode
kubectl get secret --namespace minio minio -o jsonpath="{.data.root-password}" | base64 --decode
```