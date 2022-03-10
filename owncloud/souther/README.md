#### Print owncloud admin password.
```hcl
kubectl get secret --namespace owncloud owncloud -o jsonpath="{.data.owncloud-password}" | base64 --decode
```