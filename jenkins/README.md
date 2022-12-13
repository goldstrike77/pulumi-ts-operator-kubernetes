#### Installing the Chart
```hcl
helm repo add jenkins https://charts.jenkins.io
```

#### Configuration credential values.
```hcl
pulumi config set rootPassword [password] --secret
```

#### Print jenkins admin password.
```hcl
kubectl get secret --namespace jenkins jenkins -o jsonpath="{.data.jenkins-admin-password}" | base64 --decode
```