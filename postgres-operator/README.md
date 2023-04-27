#### Installing the Chart
```hcl
helm repo add postgres-operator-charts https://opensource.zalando.com/postgres-operator/charts/postgres-operator
helm repo add postgres-operator-ui-charts https://opensource.zalando.com/postgres-operator/charts/postgres-operator-ui
```

#### Configuration credential values.
```hcl
pulumi config set AWS_ACCESS_KEY_ID [AWS_ACCESS_KEY_ID] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [AWS_SECRET_ACCESS_KEY] --secret
```