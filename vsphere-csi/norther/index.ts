import * as pulumi from "@pulumi/pulumi";
import { Namespace } from '../../packages/kubernetes/core/v1/Namespace';
import { Secret } from '../../packages/kubernetes/core/v1/Secret';
import { Release } from '../../packages/kubernetes/helm/v3/Release';
import { ConfigFile } from '../../packages/kubernetes/yaml/ConfigFile';
import { StorageClass } from '../../packages/kubernetes/storage/v1/StorageClass';

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
        version: "1.28.0",
        values: {
          config: {
            enabled: true,
            vcenter: "192.168.0.130",
            username: "administrator@vsphere.local",
            password: config.require("VSPHERE_PASSWORD"),
            datacenter: "cn-north-1",
            region: "k8s-region",
            zone: "k8s-zone"
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
          datastoreurl: "ds:///vmfs/volumes/655eacb9-92cac5ab-d5ea-002590f4baa4/",
          "csi.storage.k8s.io/fstype": "ext4",
          diskformat: "thin"
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

const namespace = new Namespace('Namespace', { resources: resources })

const secret = new Secret('Secret', { resources: resources }, { dependsOn: [namespace] });

const release = new Release('Release', { resources: resources });

const configfile = new ConfigFile('ConfigFile', { resources: resources }, { dependsOn: [secret] });

const storageclass = new StorageClass('StorageClass', { resources: resources }, { dependsOn: [configfile] });