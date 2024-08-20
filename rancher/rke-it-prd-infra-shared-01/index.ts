import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const resources = [
    {
        namespace: {
            metadata: {
                name: "cattle-system",
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
                namespace: "cattle-system",
                name: "rancher",
                chart: "rancher",
                repositoryOpts: {
                    repo: "https://releases.rancher.com/server-charts/stable"
                },
                version: "2.8.5",
                values: {
                    auditLog: {
                        image: {
                            repository: "registry.cn-hangzhou.aliyuncs.com/rancher/mirrored-bci-micro"
                        }
                    },
                    hostname: "rancher.home.local",
                    ingress: { enabled: false },
                    rancherImage: "registry.cn-hangzhou.aliyuncs.com/rancher/rancher",
                    replicas: 1,
                    resources: {},
                    postDelete: {
                        image: {
                            repository: "registry.cn-hangzhou.aliyuncs.com/rancher/shell"
                        }
                    },
                    bootstrapPassword: config.require("bootstrapPassword")
                }
            }

        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });