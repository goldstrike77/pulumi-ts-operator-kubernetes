#### Installing the Chart
```hcl
helm repo add opensearch https://opensearch-project.github.io/helm-charts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
```

#### Configuration credential values.
```hcl
pulumi config set kibanaserverPassword [password] --secret
pulumi config set adminPassword [password] --secret
pulumi config set ladpPassword [password] --secret
pulumi config set ssoClientSecret [secret] --secret
pulumi config set AWS_ACCESS_KEY_ID [AWS_ACCESS_KEY_ID] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [AWS_SECRET_ACCESS_KEY] --secret
```


#### Generate self-signed certificate.
```hcl
openssl genpkey -out server.key -algorithm RSA -pkeyopt rsa_keygen_bits:4096
openssl req -new -out server.csr -key server.key -config openssl.cnf
openssl x509 -req -in server.csr -out server.crt -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -days 3650 -extensions v3_req -extfile openssl.cnf
```