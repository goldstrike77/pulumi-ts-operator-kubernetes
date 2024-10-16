import { Release } from '../../packages/kubernetes/helm/v3/Release';

const deploy_label = {
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
                version: "1.14.4",
                values: {
                    k8sServiceHost: "192.168.0.150",
                    k8sServicePort: "6443",
                    image: {
                        repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/cilium",
                        tag: "v1.14.4",
                        pullPolicy: "IfNotPresent",
                        useDigest: false
                    },
                    podLabels: deploy_label,
                    resources: {},
                    bgp: {
                        masquerade: true
                    },
                    cni: {
                        install: true
                    },
                    devices: "eth0",
                    hubble: {
                        enabled: true,
                        metrics: {
                            enabled: ["dns:query;ignoreAAAA", "drop", "tcp", "flow", "icmp", "http"],
                            enableOpenMetrics: true,
                            serviceMonitor: {
                                enabled: false,
                                relabelings: []
                            }
                        },
                        relay: {
                            enabled: true,
                            image: {
                                repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/hubble-relay",
                                tag: "v1.14.4",
                                useDigest: false,
                                pullPolicy: "IfNotPresent"
                            },
                            resources: {},
                            replicas: 1,
                            podLabels: deploy_label,
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
                                "10.244.0.0/16"
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
                            repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/operator",
                            tag: "v1.14.4",
                            genericDigest: "sha256:2289296a8d2e0224e5ead49f6fe61a74d46dbfad64fbec28a3f5c8ae297e9481",
                            useDigest: true,
                            pullPolicy: "IfNotPresent"
                        },
                        replicas: 1,
                        podLabels: deploy_label,
                        resources: {},
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

const release = new Release('Release', { resources: resources })