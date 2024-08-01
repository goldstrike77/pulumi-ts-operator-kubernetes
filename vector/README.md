#### Installing the Chart
```hcl
helm repo add vector https://helm.vector.dev
```

#### OpenShift
```
grant the speaker DaemonSet elevated privileges.
oc adm policy add-scc-to-user privileged -n datadog -z kube-pod-vector
```