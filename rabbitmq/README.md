#### Print rabbitmq admin password.
```hcl
kubectl get secret --namespace rabbitmq rabbitmq -o jsonpath="{.data.rabbitmq-password}" | base64 --decode
```