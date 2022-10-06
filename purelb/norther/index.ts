import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "purelb",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "purelb",
                name: "purelb",
                chart: "purelb",
                repository: "https://gitlab.com/api/v4/projects/20400619/packages/helm/stable",
                version: "v0.6.4",
                values: {
                    Prometheus: {
                        allocator: {
                            Metrics: {
                                enabled: false
                            },
                            serviceMonitor: {
                                enabled: false,
                                extraLabels: {}
                            },
                            prometheusRules: {
                                enabled: false,
                                namespace: "",
                                extraLabels: {},
                                rules: []
                            }
                        },
                        lbnodeagent: {
                            Metrics: {
                                enabled: false
                            },
                            serviceMonitor: {
                                enabled: false,
                                extraLabels: {}
                            },
                            prometheusRules: {
                                enabled: false,
                                extraLabels: {},
                                rules: []
                            }
                        }
                    },
                    serviceGroup: {
                        name: "default",
                        create: true,
                        spec: {
                            local: {
                                subnet: "192.168.0.0/24",
                                pool: "192.168.0.100-192.168.0.109",
                                aggregation: "default"
                            }
                        }
                    },
                    lbnodeagent: {
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        }
                    },
                    allocator: {
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        }
                    }
                }
            }
        ]
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create Release Resource.
    for (var helm_index in deploy_spec[i].helm) {
        const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
            namespace: deploy_spec[i].helm[helm_index].namespace,
            name: deploy_spec[i].helm[helm_index].name,
            chart: deploy_spec[i].helm[helm_index].chart,
            version: deploy_spec[i].helm[helm_index].version,
            values: deploy_spec[i].helm[helm_index].values,
            skipAwait: true,
            repositoryOpts: {
                repo: deploy_spec[i].helm[helm_index].repository,
            },
        }, { dependsOn: [namespace] });
    }
}