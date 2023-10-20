import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        helm: {
            namespace: "kube-system",
            name: "cilium",
            chart: "cilium",
            repository: "https://helm.cilium.io",
            version: "1.14.3",
            values: {
                k8sServiceHost: "192.168.0.84",
                k8sServicePort: "6443",
                "image": {
                    "repository": "registry.cn-shanghai.aliyuncs.com/goldenimage/cilium",
                    "tag": "v1.14.3",
                    "pullPolicy": "IfNotPresent",
                    "useDigest": false
                },
                "resources": {},
                "bgp": {
                    "masquerade": true
                },
                "cni": {
                    "install": true
                },
                "devices": "eth0",
                "hubble": {
                    "enabled": true,
                    "metrics": {
                        "enabled": ["dns:query;ignoreAAAA", "drop", "tcp", "flow", "icmp", "http"],
                        "enableOpenMetrics": true,
                        "serviceMonitor": {
                            "enabled": false,
                            "relabelings": []
                        }
                    },
                    relay: {
                        enabled: true,
                        "image": {
                            "repository": "registry.cn-shanghai.aliyuncs.com/goldenimage/hubble-relay",
                            "tag": "v1.14.3",
                            "useDigest": false,
                            "pullPolicy": "IfNotPresent"
                        },
                        "resources": {},
                        "replicas": 1,
                        "podLabels": {},
                        "prometheus": {
                            "enabled": false,
                            "serviceMonitor": {
                                "enabled": false,
                                "relabelings": []
                            }
                        }
                    }
                },
                "ipam": {
                    mode: "kubernetes",
                    "operator": {
                        "clusterPoolIPv4PodCIDRList": [
                            "10.244.0.0/16"
                        ]
                    }
                },
                kubeProxyReplacement: true,
                "monitor": {
                    "enabled": false
                },
                "loadBalancer": {
                    "l7": null
                },
                "prometheus": {
                    "enabled": false,
                    "serviceMonitor": {
                        "enabled": false,
                        "interval": "10s",
                        "relabelings": []
                    }
                },
                "proxy": {
                    "prometheus": {
                        "enabled": false
                    }
                },
                "envoy": {
                    "enabled": false
                },
                "operator": {
                    "enabled": true,
                    "image": {
                        "repository": "registry.cn-shanghai.aliyuncs.com/goldenimage/operator",
                        "tag": "v1.14.3",
                        genericDigest: "sha256:2289296a8d2e0224e5ead49f6fe61a74d46dbfad64fbec28a3f5c8ae297e9481",
                        "useDigest": true,
                        "pullPolicy": "IfNotPresent"
                    },
                    "replicas": 1,
                    "podLabels": {},
                    "resources": {},
                    "prometheus": {
                        "enabled": false,
                        "serviceMonitor": {
                            "enabled": false,
                            "interval": "60s",
                            "relabelings": []
                        }
                    }
                }
            }
        }
    }
]

for (var i in deploy_spec) {
    // Create Release Resource.
    const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
        namespace: deploy_spec[i].helm.namespace,
        name: deploy_spec[i].helm.name,
        chart: deploy_spec[i].helm.chart,
        version: deploy_spec[i].helm.version,
        values: deploy_spec[i].helm.values,
        skipAwait: false,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    });
}