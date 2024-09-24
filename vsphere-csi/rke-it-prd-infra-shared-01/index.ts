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
    secret: [
      {
        metadata: {
          name: "vsphere-config-secret",
          namespace: "kube-system",
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
        version: "1.30.1",
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
            image: "swr.cn-east-3.myhuaweicloud.com/gcr-io/cloud-provider-vsphere",
            tag: "v1.30.1",
            replicaCount: 1,
            resources: {
              limits: { cpu: "200m", memory: "128Mi" },
              requests: { cpu: "200m", memory: "128Mi" }
            },
            podLabels: labels
          }
        }
      }
    ],
    configfile: [
      { file: "../vsphere-csi-driver.yaml" },
      { file: "../csi-vsphere-vsc.yaml" }
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
          datastoreurl: "ds:///vmfs/volumes/66e988fa-14a7efd8-1fb7-002590f4baa4/",
          "csi.storage.k8s.io/fstype": "ext4"
        },
        reclaimPolicy: "Delete",
        volumeBindingMode: "Immediate"
      }
    ]
  }
]

const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources });
const configfile = new k8s_module.yaml.ConfigFile('ConfigFile', { resources: resources }, { dependsOn: [secret] });
const storageclass = new k8s_module.storage.v1.StorageClass('StorageClass', { resources: resources }, { dependsOn: [release, configfile] })