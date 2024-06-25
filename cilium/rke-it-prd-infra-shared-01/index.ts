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
                        repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/cilium",
                        tag: "v1.14.5",
                        pullPolicy: "IfNotPresent",
                        useDigest: false
                    },
                    podLabels: labels,
                    resources: {
                        limits: { cpu: "200m", memory: "512Mi" },
                        requests: { cpu: "200m", memory: "512Mi" }
                    },
                    bpf: {
                        masquerade: true
                    },
                    devices: "eth0",
                    localRedirectPolicy: false,
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
                                tag: "v1.14.5",
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
                            tag: "v1.14.5",
                            genericDigest: "sha256:2258b425bc1118a3a4c9add8093af9d37e47daff27f2182e15c140ddb442d961",
                            useDigest: true,
                            pullPolicy: "IfNotPresent"
                        },
                        replicas: 1,
                        podLabels: labels,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
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