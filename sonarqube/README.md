#### Installing the Chart
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add sonatype https://sonatype.github.io/helm3-charts
```

#### Configuration credential values.
```hcl
pulumi config set postgresPassword [password] --secret
pulumi config set userPassword [password] --secret
pulumi config set sonarqubePassword [password] --secret
```