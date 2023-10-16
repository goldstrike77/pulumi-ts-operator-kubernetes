import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "mariadb-operator",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "mariadb-operator",
            name: "mariadb-operator",
            chart: "mariadb-operator",
            repository: "https://mariadb-operator.github.io/mariadb-operator",
            version: "0.22.0",
            values: {
                fullnameOverride: "mariadb-operator",
                logLevel: "INFO",
                ha: {
                    enabled: true,
                    replicas: 3
                },
                metrics: {
                    enabled: true,
                    serviceMonitor: { enabled: false }
                },
                resources: {
                    limits: { cpu: "100m", memory: "128Mi" },
                    requests: { cpu: "100m", memory: "128Mi" }
                },
                affinity: {
                    podAntiAffinity: {
                        requiredDuringSchedulingIgnoredDuringExecution: [
                            {
                                topologyKey: "kubernetes.io/hostname"
                            }
                        ]
                    }
                },
                webhook: {
                    serviceMonitor: { enabled: false },
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    }
                }
            }
        },
        servicemonitors: [
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "mariadb-operator",
                    namespace: "mariadb-operator"
                },
                spec: {
                    podMetricsEndpoints: [
                        {
                            interval: "60s",
                            scrapeTimeout: "30s",
                            scheme: "http",
                            targetPort: "metrics",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { action: "replace", replacement: "demo", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "dev", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "Operator", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "mariadb", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "dc01", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["mariadb-operator"]
                    },
                    selector: {
                        matchLabels: {
                            "app.kubernetes.io/name": "mariadb-operator"
                        }
                    }
                }
            },
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "mariadb-operator-webhook",
                    namespace: "mariadb-operator"
                },
                spec: {
                    podMetricsEndpoints: [
                        {
                            interval: "60s",
                            scrapeTimeout: "30s",
                            scheme: "http",
                            targetPort: "metrics",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { action: "replace", replacement: "demo", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "dev", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "Operator", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "mariadb", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "dc01", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["mariadb-operator"]
                    },
                    selector: {
                        matchLabels: {
                            "app.kubernetes.io/name": "mariadb-operator-webhook"
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
    const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
        namespace: deploy_spec[i].helm.namespace,
        name: deploy_spec[i].helm.name,
        chart: deploy_spec[i].helm.chart,
        version: deploy_spec[i].helm.version,
        values: deploy_spec[i].helm.values,
        skipAwait: true,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    }, { dependsOn: [namespace] });
    // Create service monitor.
    for (var servicemonitor_index in deploy_spec[i].servicemonitors) {
        const servicemonitor = new k8s.apiextensions.CustomResource(deploy_spec[i].servicemonitors[servicemonitor_index].metadata.name, {
            apiVersion: deploy_spec[i].servicemonitors[servicemonitor_index].apiVersion,
            kind: deploy_spec[i].servicemonitors[servicemonitor_index].kind,
            metadata: deploy_spec[i].servicemonitors[servicemonitor_index].metadata,
            spec: deploy_spec[i].servicemonitors[servicemonitor_index].spec
        }, { dependsOn: [release] });
    }
}