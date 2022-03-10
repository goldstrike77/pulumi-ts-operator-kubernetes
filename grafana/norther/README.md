#### Print grafana admin password.
```hcl
kubectl get secret --namespace visualization grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```