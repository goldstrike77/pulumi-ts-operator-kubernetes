import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "ingress-apisix",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "ingress-apisix",
            name: "apisix",
            chart: "apisix",
            repository: "https://charts.apiseven.com",
            version: "1.1.1",
            values: {
                apisix: {
                    replicaCount: 1,
                    resources: {
                        limits: { cpu: "200m", memory: "512Mi" },
                        requests: { cpu: "200m", memory: "512Mi" }
                    },
                    timezone: "Asia/Shanghai"
                },
                admin: {
                    allow: {
                        ipList: ["127.0.0.1/24", "192.168.0.0/24"]
                    }
                },
                gateway: {
                    type: "LoadBalancer"
                },
                serviceMonitor: {
                    enabled: true,
                    interval: "60s",
                    labels: {
                        customer: "demo",
                        environment: "dev",
                        project: "API-Gateway",
                        group: "apisix",
                        datacenter: "dc01",
                        domain: "local"
                    }
                },
                etcd: {
                    enabled: true,
                    replicaCount: 1,
                    podLabels: { customer: "demo", environment: "dev", project: "API-Gateway", group: "etcd", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "300m", memory: "512Mi" },
                        requests: { cpu: "300m", memory: "512Mi" }
                    },
                    auth: {
                        rbac: {
                            create: false,
                            user: "root",
                            password: config.require("etcdPassword")
                        }
                    },
                    persistence: {
                        storageClass: "longhorn",
                        size: "8Gi"
                    },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    },
                    metrics: {
                        enabled: true,
                        podMonitor: {
                            enabled: true,
                            interval: "60s",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        },
                        prometheusRule: {
                            enabled: false,
                            rules: []
                        }
                    },
                },
                dashboard: {
                    enabled: true,
                    replicaCount: 1,
                    labelsOverride: {
                        customer: "demo",
                        environment: "dev",
                        project: "API-Gateway",
                        group: "apisix-dashboard",
                        datacenter: "dc01",
                        domain: "local"
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                },
                "ingress-controller": {
                    enabled: true,
                    replicaCount: 1,
                    labelsOverride: {
                        customer: "demo",
                        environment: "dev",
                        project: "API-Gateway",
                        group: "apisix-ingress-controller",
                        datacenter: "dc01",
                        domain: "local"
                    },
                    kubernetes: {
                        enableGatewayAPI: true
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
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