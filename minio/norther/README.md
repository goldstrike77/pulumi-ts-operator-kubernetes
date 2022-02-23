#### Print minio accesskey and secretkey.
```hcl
kubectl get secret --namespace minio minio -o jsonpath="{.data.rootUser}" | base64 --decode
kubectl get secret --namespace minio minio -o jsonpath="{.data.rootPassword}" | base64 --decode
```