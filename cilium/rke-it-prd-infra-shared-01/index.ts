import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

const labels = {
    customer: "demo",
    environment: "dev",
    project: "CNI",
    group: "Cilium",
    datacenter: "dc01",
    domain: "local"
}

const resources = [
    {
        release: [
            {
                namespace: "kube-system",
                name: "cilium",
                chart: "cilium",
                repositoryOpts: {
                    repo: "https://helm.cilium.io"
                },
                version: "1.15.6",
                values: {
                    k8sServiceHost: "192.168.0.151",
                    k8sServicePort: "6443",
                    k8sClientRateLimit: {
                        qps: 10,
                        burst: 20
                    },
                    cluster: {
                        name: "rke-it-prd-infra-shared-01",
                        id: 0
                    },
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/quay-io/cilium",
                        tag: "v1.15.6",
                        pullPolicy: "IfNotPresent",
                        useDigest: false
                    },
                    podLabels: labels,
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    bpf: {
                        masquerade: true
                    },
                    devices: "ens192",
                    localRedirectPolicy: false,
                    hubble: {
                        enabled: true,
                        metrics: {
                            enabled: ["dns:query;ignoreAAAA", "drop", "tcp", "flow", "icmp", "http"],
                            enableOpenMetrics: true,
                            serviceMonitor: {
                                enabled: false,
                                relabelings: []
                            },
                            dashboards: { 
                                enabled: false,
                                namespace: "visualization"

                             }
                        },
                        relay: {
                            enabled: true,
                            image: {
                                repository: "swr.cn-east-3.myhuaweicloud.com/quay-io/hubble-relay",
                                tag: "v1.15.6",
                                useDigest: false,
                                pullPolicy: "IfNotPresent"
                            },
                            resources: {
                                limits: { cpu: "50m", memory: "64Mi" },
                                requests: { cpu: "50m", memory: "64Mi" }
                            },
                            replicas: 1,
                            podLabels: labels,
                            prometheus: {
                                enabled: false,
                                serviceMonitor: {
                                    enabled: false,
                                    relabelings: []
                                }
                            }
                        }
                    },
                    ipam: {
                        mode: "kubernetes",
                        operator: {
                            clusterPoolIPv4PodCIDRList: [
                                "10.42.0.0/16"
                            ]
                        }
                    },
                    kubeProxyReplacement: true,
                    monitor: {
                        enabled: false
                    },
                    loadBalancer: {
                        l7: null
                    },
                    prometheus: {
                        enabled: false,
                        serviceMonitor: {
                            enabled: false,
                            interval: "10s",
                            relabelings: []
                        }
                    },
                    proxy: {
                        prometheus: {
                            enabled: false
                        }
                    },
                    envoy: {
                        enabled: false
                    },
                    operator: {
                        enabled: true,
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/quay-io/operator",
                            tag: "v1.15.6",
                            genericDigest: "sha256:3d1117e41e246ab4e5d8d69670d36abf376c1254e1852f6b2638340652739572",
                            useDigest: true,
                            pullPolicy: "IfNotPresent"
                        },
                        replicas: 1,
                        podLabels: labels,
                        resources: {
                            limits: { cpu: "50m", memory: "128Mi" },
                            requests: { cpu: "50m", memory: "128Mi" }
                        },
                        prometheus: {
                            enabled: false,
                            serviceMonitor: {
                                enabled: false,
                                interval: "60s",
                                relabelings: []
                            }
                        }
                    }
                }
            }
        ]
    }
]

const release = new k8s_module.helm.v3.Release('Release', { resources: resources });