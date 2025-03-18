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
                version: "1.17.2",
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
                        tag: "v1.17.2",
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
                    devices: "ens192",
                    localRedirectPolicy: false,
                    hubble: {
                        enabled: true,
                        metrics: {
                            enabled: ["dns:query;ignoreAAAA", "drop", "tcp", "flow", "icmp", "http"],
                            enableOpenMetrics: true,
                            serviceMonitor: {
                                enabled: false
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
                                tag: "v1.17.2",
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
                                    enabled: false
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
                            interval: "10s"
                        }
                    },
                    envoy: {
                        enabled: false
                    },
                    operator: {
                        enabled: true,
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/quay-io/operator",
                            tag: "v1.17.2",
                            genericDigest: "sha256:dfe60fae39b1a5462abc568cbb8458e1af4375af5a6f60868402236f914460f8",
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
                                interval: "60s"
                            }
                        }
                    }
                }
            }
        ]
    }
]

const release = new k8s_module.helm.v3.Release('Release', { resources: resources });