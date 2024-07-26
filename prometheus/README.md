#### Installing the Chart
```hcl
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set OBJSTORE.YML [string] --secret
pulumi config set ADDITIONALSCRAPE.JOB [string] --secret
pulumi config set ALERTMANAGER.YAML [string] --secret
pulumi config set consulToken [string] --secret
```

#### Openshift
```
change annotation value of source ConfigMap & Secret.

kubed.appscode.com/sync="kubernetes.io/metadata.name=monitoring"

##### secret:
prometheus-k8s-tls
prometheus-k8s-proxy
prometheus-k8s-thanos-sidecar-tls
kube-rbac-proxy
metrics-client-certs

##### configMap:
serving-certs-ca-bundle
kubelet-serving-ca-bundle
metrics-client-ca
```