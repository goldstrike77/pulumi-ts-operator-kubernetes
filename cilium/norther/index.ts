import * as k8s_module from '../../../module/pulumi-ts-module-kubernetes';

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
                version: "1.14.4",
                values: {
                    k8sServiceHost: "192.168.0.120",
                    k8sServicePort: "6443",
                    image: {
                        repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/cilium",
                        tag: "v1.14.4",
                        pullPolicy: "IfNotPresent",
                        useDigest: false
                    },
                    podLabels: labels,
                    resources: {
                        limits: { cpu: "200m", memory: "512Mi" },
                        requests: { cpu: "200m", memory: "512Mi" }
                    },
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
                            tag: "v1.14.4",
                            genericDigest: "sha256:2289296a8d2e0224e5ead49f6fe61a74d46dbfad64fbec28a3f5c8ae297e9481",
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