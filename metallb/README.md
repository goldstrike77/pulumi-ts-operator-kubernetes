#### Installing the Chart
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
or
helm repo add metallb https://metallb.github.io/metallb
```

#### OpenShift
```
grant the speaker DaemonSet elevated privileges.
oc adm policy add-scc-to-user privileged -n metallb-system 
```