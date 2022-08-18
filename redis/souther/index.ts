import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "redis",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "redis",
                chart: "redis",
                repository: "https://charts.bitnami.com/bitnami",
                version: "17.0.11",
                values: {
                    architecture: "replication",
                    auth: {
                        enabled: true,
                        sentinel: true,
                        password: config.require("Password")
                    },
                    commonConfiguration: `appendonly yes
maxmemory 100mb
tcp-keepalive 60
tcp-backlog 8192
maxclients 2000
bind 0.0.0.0
databases 2`,
                    master: {
                        count: 1,
                        disableCommands: ["FLUSHDB", "FLUSHALL", "SHUTDOWN"],
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "8192" }] },
                        persistence: { enabled: true, storageClass: "longhorn", size: "8Gi" }
                    },
                    replica: {
                        replicaCount: 3,
                        disableCommands: ["FLUSHDB", "FLUSHALL", "SHUTDOWN"],
                        resources: {
                            limits: { cpu: "200m", memory: "128Mi" },
                            requests: { cpu: "200m", memory: "128Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "8192" }] },
                        persistence: { enabled: true, storageClass: "longhorn", size: "8Gi" }
                    },
                    sentinel: {
                        enabled: true,
                        masterSet: "master",
                        quorum: 2,
                        persistence: { enabled: false },
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        }
                    },
                    metrics: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        serviceMonitor: {
                            enabled: true,
                            relabellings: [
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ],
                        },
                        prometheusRule: { enabled: false }
                    },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        }
                    },
                    sysctl: {
                        enabled: true,
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
        const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].chart, {
            namespace: deploy_spec[i].helm[helm_index].namespace,
            name: deploy_spec[i].helm[helm_index].chart,
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