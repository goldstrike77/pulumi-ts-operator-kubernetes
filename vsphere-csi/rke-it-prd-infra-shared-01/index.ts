import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const labels = {
  customer: "it",
  environment: "prd",
  project: "CSI",
  group: "vSphere",
  datacenter: "cn-north",
  domain: "local"
}

const resources = [
  {
    release: [
      {
        namespace: "kube-system",
        name: "vsphere-cpi",
        chart: "vsphere-cpi",
        repositoryOpts: {
          repo: "https://kubernetes.github.io/cloud-provider-vsphere"
        },
        version: "1.30.1",
        values: {
          config: {
            enabled: true,
            vcenter: "vcenter.esxi.lab",
            username: "administrator@vsphere.local",
            password: config.require("VSPHERE_PASSWORD"),
            datacenter: "cn-north",
            region: "k8s-region",
            zone: "k8s-zone"
          },
          podSecurityPolicy: { enabled: false },
          daemonset: {
            image: "swr.cn-east-3.myhuaweicloud.com/gcr-io/cloud-provider-vsphere",
            tag: "v1.30.1",
            replicaCount: 1,
            resources: {
              limits: { cpu: "100m", memory: "64Mi" },
              requests: { cpu: "100m", memory: "64Mi" }
            },
            podLabels: labels
          }
        }
      },
      {
        namespace: "kube-system",
        name: "vsphere-csi",
        chart: "vsphere-csi",
        repositoryOpts: {
          repo: "https://vsphere-tmm.github.io/helm-charts"
        },
        version: "3.6.0",
        values:
        {
          global: {
            imageRegistry: "swr.cn-east-3.myhuaweicloud.com",
            config: {
              csidriver: {
                enabled: true
              },
              storageclass: {
                enabled: false,
                name: "vsphere-csi",
                expansion: false,
                default: false,
                reclaimPolicy: "Delete"
              },
              global: {
                port: 443,
                "insecure-flag": true,
                "cluster-id": "cn-north-1"
              },
              vcenter: {
                "vcenter.esxi.lab": {
                  server: "vcenter.esxi.lab",
                  user: "administrator@vsphere.local",
                  password: config.require("VSPHERE_PASSWORD"),
                  datacenters: ["cn-north"]
                }
              }
            }
          },
          controller: {
            name: "vsphere-csi-controller",
            config: {
              "trigger-csi-fullsync": false,
              "pv-to-backingdiskobjectid-mapping": false
            },
            image: { repository: "gcr-io/driver" },
            resizer: {
              image: { repository: "gcr-io/csi-resizer" },
              resources: {
                limits: { cpu: "50m", memory: "32Mi" },
                requests: { cpu: "50m", memory: "32Mi" }
              }
            },
            attacher: {
              image: { repository: "gcr-io/csi-attacher" },
              resources: {
                limits: { cpu: "50m", memory: "32Mi" },
                requests: { cpu: "50m", memory: "32Mi" }
              }
            },
            livenessprobe: {
              image: { repository: "gcr-io/livenessprobe" },
              resources: {
                limits: { cpu: "50m", memory: "32Mi" },
                requests: { cpu: "50m", memory: "32Mi" }
              }
            },
            syncer: {
              image: { repository: "gcr-io/syncer" },
              resources: {
                limits: { cpu: "50m", memory: "64Mi" },
                requests: { cpu: "50m", memory: "64Mi" }
              }
            },
            provisioner: {
              image: { repository: "gcr-io/csi-provisioner" },
              resources: {
                limits: { cpu: "50m", memory: "32Mi" },
                requests: { cpu: "50m", memory: "32Mi" }
              }
            },
            snapshotter: {
              image: { repository: "gcr-io/csi-snapshotter" },
              resources: {
                limits: { cpu: "50m", memory: "32Mi" },
                requests: { cpu: "50m", memory: "32Mi" }
              }
            },
            replicaCount: 1,
            resources: {
              limits: { cpu: "50m", memory: "64Mi" },
              requests: { cpu: "50m", memory: "64Mi" }
            },
            podLabels: labels,
            tolerations: [{ key: "CriticalAddonsOnly", operator: "Exists" }],
          },
          snapshotwebhook: {
            image: { repository: "gcr-io/snapshot-validation-webhook" },
            replicaCount: 1,
            resources: {
              limits: { cpu: "50m", memory: "32Mi" },
              requests: { cpu: "50m", memory: "32Mi" }
            },
            podLabels: labels
          },
          node: {
            image: { repository: "gcr-io/driver" },
            registrar: {
              image: { repository: "gcr-io/csi-node-driver-registrar" },
              resources: {
                limits: { cpu: "50m", memory: "32Mi" },
                requests: { cpu: "50m", memory: "32Mi" }
              }
            },
            livenessprobe: {
              image: { repository: "gcr-io/livenessprobe" },
              resources: {
                limits: { cpu: "50m", memory: "32Mi" },
                requests: { cpu: "50m", memory: "32Mi" }
              }
            },
            resources: {
              limits: { cpu: "50m", memory: "32Mi" },
              requests: { cpu: "50m", memory: "32Mi" }
            },
            podLabels: labels
          },
          winnode: {
            name: "vsphere-csi-node-windows",
            image: { repository: "gcr-io/driver" },
            registrar: {
              image: { repository: "gcr-io/csi-node-driver-registrar" },
              resources: {
                limits: { cpu: "50m", memory: "32Mi" },
                requests: { cpu: "50m", memory: "32Mi" }
              }
            },
            livenessprobe: {
              image: { repository: "gcr-io/livenessprobe" },
              resources: {
                limits: { cpu: "50m", memory: "32Mi" },
                requests: { cpu: "50m", memory: "32Mi" }
              }
            },
            resources: {
              limits: { cpu: "50m", memory: "32Mi" },
              requests: { cpu: "50m", memory: "32Mi" }
            }
          },
          metrics: {
            enabled: false,
            serviceMonitor: {
              enabled: false,
              interval: "60s",
              relabelings: []
            }
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
          datastoreurl: "ds:///vmfs/volumes/667a8f3c-b9c7d93d-e0b9-002590f4baa4/",
          "csi.storage.k8s.io/fstype": "ext4"
        },
        reclaimPolicy: "Delete",
        volumeBindingMode: "Immediate"

      }
    ]
  }
]

const release = new k8s_module.helm.v3.Release('Release', { resources: resources });
const storageclass = new k8s_module.storage.v1.StorageClass('StorageClass', { resources: resources }, { dependsOn: [release] });