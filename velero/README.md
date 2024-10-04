#### Installing the Chart
```hcl
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
```

#### Configuration credential values.
```hcl
pulumi config set AWS_ACCESS_KEY_ID [string] --secret
pulumi config set AWS_SECRET_ACCESS_KEY [string] --secret
```

#### 供应商必须支持 CSI 快照
```
apiVersion: snapshot.storage.k8s.io/v1
deletionPolicy: Retain
driver: csi.vsphere.vmware.com
kind: VolumeSnapshotClass
metadata:
  annotations:
    snapshot.storage.kubernetes.io/is-default-class: 'true'
  labels:
    velero.io/csi-volumesnapshot-class: 'true'
  name: csi-vsphere-vsc
```