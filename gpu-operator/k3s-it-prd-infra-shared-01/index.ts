import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const podlabels = {
    customer: "it",
    environment: "prd",
    project: "shared",
    group: "k3s-it-prd-infra-shared-01",
    datacenter: "cn-north",
    domain: "local"
}

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "gpu-operator",
                    annotations: {},
                    labels: {}
                },
                spec: {}
            }
        ],
        release: [
            {
                namespace: "gpu-operator",
                name: "gpu-operator",
                chart: "gpu-operator",
                repositoryOpts: {
                    repo: "https://helm.ngc.nvidia.com/nvidia"
                },
                version: "v26.7.1",
                values: {
                    daemonsets: {
                        labels: podlabels
                    },
                    driver: {
                        version: "580.178.04"
                    },
                    "node-feature-discovery": {
                        image: {
                            repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/node-feature-discovery",
                            tag: "v0.19.0"
                        }
                    },
                    toolkit: {
                        env: [
                            {
                                name: "CONTAINERD_SOCKET",
                                value: "/run/k3s/containerd/containerd.sock"
                            }
                        ]
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });