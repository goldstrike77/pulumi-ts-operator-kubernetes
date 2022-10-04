import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "logging",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "loki-conf-secret",
                    namespace: "logging",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "config.yaml": config.require("CONFIG.YAML"),
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "logging",
                name: "loki",
                chart: "loki-distributed",
                repository: "https://grafana.github.io/helm-charts",
                version: "0.58.0",
                values: {
                    nameOverride: "loki",
                    loki: {
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        existingSecretForConfig: "loki-conf-secret",
                        config: "",
                    },
                    serviceMonitor: {
                        enabled: true,
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                        ],
                    },
                    prometheusRule: { enabled: true },
                    ingester: {
                        replicas: 2,
                        resources: {
                            limits: { cpu: "200m", memory: "512Mi" },
                            requests: { cpu: "200m", memory: "512Mi" }
                        },
                        persistence: { enabled: true, size: "10Gi", storageClass: "longhorn" }
                    },
                    distributor: {
                        replicas: 2,
                        resources: {
                            limits: { cpu: "200m", memory: "128Mi" },
                            requests: { cpu: "200m", memory: "128Mi" }
                        }
                    },
                    querier: {
                        replicas: 2,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        }
                    },
                    queryFrontend: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        }
                    },
                    gateway: {
                        enabled: true,
                        replicas: 2,
                        verboseLogging: false,
                        resources: {
                            limits: { cpu: "200m", memory: "128Mi" },
                            requests: { cpu: "200m", memory: "128Mi" }
                        },
                        service: {
                            port: 8080,
                            type: "LoadBalancer",
                            annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
                        }
                    },
                    compactor: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        persistence: { enabled: true, size: "8Gi", storageClass: "longhorn" }
                    },
                    ruler: { enabled: false, replicas: 1, resources: {}, directories: {} },
                    memcachedExporter: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "200m", memory: "64Mi" },
                            requests: { cpu: "200m", memory: "64Mi" }
                        }
                    },
                    memcachedChunks: {
                        enabled: true,
                        extraArgs: ["-m 2000", "-I 2m", "-v"],
                        resources: {
                            limits: { cpu: "1000m", memory: "2048Mi" },
                            requests: { cpu: "1000m", memory: "2048Mi" }
                        }
                    },
                    memcachedFrontend: {
                        enabled: true,
                        extraArgs: ["-m 2000", "-I 2m", "-v"],
                        resources: {
                            limits: { cpu: "1000m", memory: "2048Mi" },
                            requests: { cpu: "1000m", memory: "2048Mi" }
                        }
                    },
                    memcachedIndexQueries: {
                        enabled: true,
                        extraArgs: ["-m 2000", "-I 2m", "-v"],
                        resources: {
                            limits: { cpu: "1000m", memory: "2048Mi" },
                            requests: { cpu: "1000m", memory: "2048Mi" }
                        }
                    },
                    memcachedIndexWrites: { enabled: false }
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
    // Create Kubernetes Secret.
    for (var secret_index in deploy_spec[i].secret) {
        const secret = new k8s.core.v1.Secret(deploy_spec[i].secret[secret_index].metadata.name, {
            metadata: deploy_spec[i].secret[secret_index].metadata,
            type: deploy_spec[i].secret[secret_index].type,
            data: deploy_spec[i].secret[secret_index].data,
            stringData: deploy_spec[i].secret[secret_index].stringData
        }, { dependsOn: [namespace] });
    }
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