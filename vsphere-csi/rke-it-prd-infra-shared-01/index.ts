import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const labels = {
  customer: "demo",
  environment: "dev",
  project: "CSI",
  group: "vSphere",
  datacenter: "dc01",
  domain: "local"
}

const resources = [
  {
    namespace: {
      metadata: {
        name: "vmware-system-csi",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    secret: [
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
      }
    ],
    release: [
      {
        namespace: "kube-system",
        name: "vsphere-cpi",
        chart: "vsphere-cpi",
        repositoryOpts: {
          repo: "https://kubernetes.github.io/cloud-provider-vsphere"
        },
        version: "1.30.0",
        values: {
          config: {
            enabled: true,
            vcenter: "192.168.0.130",
            username: "administrator@vsphere.local",
            password: config.require("VSPHERE_PASSWORD"),
            datacenter: "cn-north",
            region: "k8s-region",
            zone: "k8s-zone"
          },
          podSecurityPolicy: { enabled: false },
          daemonset: {
            image: "swr.cn-east-3.myhuaweicloud.com/cloud-provider-vsphere/manager",
            tag: "v1.30.0",
            replicaCount: 1,
            resources: {
              limits: { cpu: "50m", memory: "64Mi" },
              requests: { cpu: "50m", memory: "64Mi" }
            },
            podLabels: labels
          }
        }
      }
    ],
    storageclass: [
      {
        metadata: {
          name: "vsphere-san-sc",
          annotations: {
            "storageclass.kubernetes.io/is-default-class": "true"
          }
        },
        provisioner: "csi.vsphere.vmware.com",
        allowVolumeExpansion: true,
        parameters: {
          datastoreurl: "ds:///vmfs/volumes/6640a1c2-b3af3782-fde7-002590f4baa4/",
          "csi.storage.k8s.io/fstype": "ext4"
        },
        reclaimPolicy: "Delete",
        volumeBindingMode: "Immediate"

      }
    ],
    configfile: [
      { file: "../vsphere-csi-driver.yaml" }
    ]
  }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources });
const configfile = new k8s_module.yaml.ConfigFile('ConfigFile', { resources: resources }, { dependsOn: [secret] });
const storageclass = new k8s_module.storage.v1.StorageClass('StorageClass', { resources: resources }, { dependsOn: [configfile] });