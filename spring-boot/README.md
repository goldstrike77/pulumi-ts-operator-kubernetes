#### Installing the Chart.
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set rootPassword [password] --secret
pulumi config set userPassword [password] --secret
```

#### Test application.
```
curl -k -X GET \
  https://spring-boot.example.com/api/v1/pets \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json'
```