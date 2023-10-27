import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_label = {
  customer: "demo",
  environment: "dev",
  project: "CSI",
  group: "vSphere",
  datacenter: "dc01",
  domain: "local"
}

const deploy_spec = [
  {
    namespace: {
      metadata: {
        name: "vmware-system-csi",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    secret:
    {
      metadata: {
        name: "vsphere-config-secret",
        namespace: "vmware-system-csi",
        annotations: {},
        labels: {}
      },
      type: "Opaque",
      data: {
        "csi-vsphere.conf": config.require("CSI-VSPHERE")
      },
      stringData: {}
    },
    vsphere_cpi: {
      namespace: "kube-system",
      name: "vsphere-cpi",
      chart: "vsphere-cpi",
      repository: "https://kubernetes.github.io/cloud-provider-vsphere",
      version: "1.28.0",
      values: {
        config: {
          enabled: true,
          vcenter: "192.168.0.130",
          username: "administrator@vsphere.local",
          password: config.require("VSPHERE_PASSWORD"),
          datacenter: "Demo"
        },
        podSecurityPolicy: { enabled: false },
        daemonset: {
          image: "registry.cn-shanghai.aliyuncs.com/goldenimage/mirrored-cloud-provider-vsphere-cpi-release-manager",
          tag: "v1.28.0",
          replicaCount: 1,
          resources: {
            limits: { cpu: "50m", memory: "64Mi" },
            requests: { cpu: "50m", memory: "64Mi" }
          },
          podLabels: deploy_label
        }
      }
    },
    vsphere_csi: {
      name: "../vsphere-csi-driver.yaml"
    },
    storageclass: {
      kind: "StorageClass",
      apiVersion: "storage.k8s.io/v1",
      metadata: {
        name: "vsphere-san-sc",
        annotations: {
          "storageclass.kubernetes.io/is-default-class": "true"
        }
      },
      provisioner: "csi.vsphere.vmware.com",
      allowVolumeExpansion: true,
      parameters: {
        "csi.storage.k8s.io/fstype": "ext4"
      },
      reclaimPolicy: "Delete",
      volumeBindingMode: "Immediate"
    }
  }
]

for (var i in deploy_spec) {
  // Create Kubernetes Namespace.
  const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
    metadata: deploy_spec[i].namespace.metadata,
    spec: deploy_spec[i].namespace.spec
  });
  // Create Kubernetes Secret.
  const secret = new k8s.core.v1.Secret(deploy_spec[i].secret.metadata.name, {
    metadata: deploy_spec[i].secret.metadata,
    type: deploy_spec[i].secret.type,
    data: deploy_spec[i].secret.data,
    stringData: deploy_spec[i].secret.stringData
  }, { dependsOn: [namespace] });
  // Create Release Resource.
  const vsphere_cpi = new k8s.helm.v3.Release(deploy_spec[i].vsphere_cpi.name, {
    namespace: deploy_spec[i].vsphere_cpi.namespace,
    name: deploy_spec[i].vsphere_cpi.name,
    chart: deploy_spec[i].vsphere_cpi.chart,
    version: deploy_spec[i].vsphere_cpi.version,
    values: deploy_spec[i].vsphere_cpi.values,
    skipAwait: false,
    repositoryOpts: {
      repo: deploy_spec[i].vsphere_cpi.repository,
    },
  }, { dependsOn: [namespace] });
  // Create vSphere CSI Driver.
  const vsphere_csi = new k8s.yaml.ConfigFile(deploy_spec[i].vsphere_csi.name, {
    file: deploy_spec[i].vsphere_csi.name,
    skipAwait: true,
  }, { dependsOn: [secret] });
  // Create apisix Custom resource definition .
  const rules = new k8s.apiextensions.CustomResource(deploy_spec[i].storageclass.metadata.name, {
    apiVersion: deploy_spec[i].storageclass.apiVersion,
    kind: deploy_spec[i].storageclass.kind,
    metadata: deploy_spec[i].storageclass.metadata,
    provisioner: deploy_spec[i].storageclass.provisioner,
    allowVolumeExpansion: deploy_spec[i].storageclass.allowVolumeExpansion,
    parameters: deploy_spec[i].storageclass.parameters,
    reclaimPolicy: deploy_spec[i].storageclass.reclaimPolicy,
    volumeBindingMode: deploy_spec[i].storageclass.volumeBindingMode
  }, { dependsOn: [vsphere_csi] });
}