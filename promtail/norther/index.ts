import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "promtail",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "promtail",
            name: "promtail",
            chart: "promtail",
            repository: "https://grafana.github.io/helm-charts",
            version: "6.8.1",
            values: {
                podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                resources: {
                    limits: { cpu: "200m", memory: "128Mi" },
                    requests: { cpu: "200m", memory: "128Mi" }
                },
                defaultVolumes: [
                    {
                        name: "run",
                        hostPath: {
                            path: "/run/promtail"
                        }
                    },
                    {
                        name: "containers",
                        hostPath: {
                            path: "/data/containerd"
                        }
                    },
                    {
                        name: "pods",
                        hostPath: {
                            path: "/var/log/pods"
                        }
                    }
                ],
                defaultVolumeMounts: [
                    {
                        name: "run",
                        mountPath: "/run/promtail"
                    },
                    {
                        name: "containers",
                        mountPath: "/data/containerd", readOnly: true
                    },
                    {
                        name: "pods",
                        mountPath: "/var/log/pods", readOnly: true
                    }
                ],
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
                    prometheusRule: {
                        enabled: false,
                        rules: []
                    }
                },
                config: {
                    logLevel: "warn",
                    clients: [
                        { url: "http://loki-distributor.logging.svc.cluster.local:3100/api/prom/push" }
                    ],
                    snippets: {
                        addScrapeJobLabel: true,
                        extraRelabelConfigs: [
                            { replacement: "norther", target_label: "cluster" }
                        ]
                    }
                }
            }
        }
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
}