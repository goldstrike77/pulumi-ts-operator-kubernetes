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
kubectl annotate -n openshift-monitoring --overwrite secret prometheus-k8s-tls kubed.appscode.com/sync="kubernetes.io/metadata.name=monitoring"
kubectl annotate -n openshift-monitoring --overwrite secret prometheus-k8s-proxy kubed.appscode.com/sync="kubernetes.io/metadata.name=monitoring"
kubectl annotate -n openshift-monitoring --overwrite secret prometheus-k8s-thanos-sidecar-tls kubed.appscode.com/sync="kubernetes.io/metadata.name=monitoring"
kubectl annotate -n openshift-monitoring --overwrite secret kube-rbac-proxy kubed.appscode.com/sync="kubernetes.io/metadata.name=monitoring"
kubectl annotate -n openshift-monitoring --overwrite secret metrics-client-certs kubed.appscode.com/sync="kubernetes.io/metadata.name=monitoring"

##### configMap:
kubectl annotate -n openshift-monitoring --overwrite configmap serving-certs-ca-bundle kubed.appscode.com/sync="kubernetes.io/metadata.name=monitoring"
kubectl annotate -n openshift-monitoring --overwrite configmap kubelet-serving-ca-bundle kubed.appscode.com/sync="kubernetes.io/metadata.name=monitoring"
kubectl annotate -n openshift-monitoring --overwrite configmap metrics-client-ca kubed.appscode.com/sync="kubernetes.io/metadata.name=monitoring"
```