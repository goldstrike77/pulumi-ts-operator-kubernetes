import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const resources = [
    {
        namespace: {
            metadata: {
                name: "vmware-exporter",
                annotations: {},
                labels: {
                    "pod-security.kubernetes.io/enforce": "privileged",
                    "pod-security.kubernetes.io/audit": "privileged",
                    "pod-security.kubernetes.io/warn": "privileged"
                }
            },
            spec: {}
        },
        release: [
            {
                namespace: "vmware-exporter",
                name: "vmware-exporter",
                chart: "../../_chart/vmware-exporter.tgz",
                repository: "",
                version: "0.13.2",
                values: {
                    replicaCount: 1,
                    vsphere: {
                        user: "administrator@vsphere.local",
                        password: config.require("password"),
                        host: "vcenter.esxi.lab",
                        collectors: {
                            hosts: true,
                            datastores: true,
                            vms: true,
                            vmguests: true,
                            snapshots: false
                        }
                    },
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/vmware_exporter",
                        tag: "v0.18.4"
                    },
                    service: { enabled: true },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    }
                }
            }
        ],
        configfile: [
            { file: "./servicemonitor.yaml" },
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });
const configfile = new k8s_module.yaml.ConfigFile('ConfigFile', { resources: resources }, { dependsOn: [release] });