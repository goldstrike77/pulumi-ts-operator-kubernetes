#### Installing the Chart
```hcl
helm repo add vsphere-cpi https://kubernetes.github.io/cloud-provider-vsphere
or for RKE2
helm repo add rke2-charts https://rke2-charts.rancher.io/
```

#### Configuration credential values.
```hcl
pulumi config set VSPHERE_PASSWORD [string] --secret
pulumi config set CSI-VSPHERE [string] --secret
```

```hcl
https://github.com/kubernetes-sigs/vsphere-csi-driver/tree/v3.1.2/manifests/vanilla
修改/var/lib为实际地址。
controller replicas为master数量。
需要注意对应k8s版本。
RKE2启用Pod Security Standards后需要部署到kube-system namespace.
遇到Database temporarily unavailable or has network problems. https://kb.vmware.com/s/article/2147750
```