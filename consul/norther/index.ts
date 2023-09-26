import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "consul",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "consul",
            name: "consul",
            chart: "consul",
            repository: "https://charts.bitnami.com/bitnami",
            version: "10.13.3",
            values: {
                datacenterName: "dc1",
                domain: "consul",
                gossipKey: config.require("gossipKey"),
                localConfig: `
{
    "acl": {
        "enabled": true,
        "default_policy": "deny",
        "enable_token_persistence": true,
        "tokens": {
          "initial_management": "${config.require("tokensMaster")}",
          "agent": "${config.require("tokensMaster")}"
        }
    }
}`,
                extraEnvVars: [
                    { name: "CONSUL_HTTP_TOKEN", value: config.require("tokensMaster") }
                ],
                podLabels: { customer: "demo", environment: "dev", project: "ServiceDiscovery", group: "consul", datacenter: "dc01", domain: "local" },
                replicaCount: 3,
                resources: {
                    limits: { cpu: "200m", memory: "128Mi" },
                    requests: { cpu: "200m", memory: "128Mi" }
                },
                persistence: {
                    enabled: true,
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
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    },
                    serviceMonitor: {
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
                        ],
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