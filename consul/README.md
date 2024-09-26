#### Installing the Chart
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add hashicorp https://helm.releases.hashicorp.com
```

#### Configuration credential values.
```hcl
pulumi config set gossipKey Ek3ceyPsJuHiWpvn/TNcUeDXiXttyMag8QTJ0qOEQOM= --secret
pulumi config set tokensMaster 7471828c-d50a-4b25-b6a5-d80f02a03bae --secret
```