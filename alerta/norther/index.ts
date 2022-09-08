import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "alerta",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            /**
                        {
                            namespace: "alerta",
                            name: "alerta",
                            chart: "../../_chart/alerta.tgz",
                            // repository: "https://github.com/alerta/docker-alerta",
                            repository: "", // Must be empty string if local chart.
                            version: "0.1",
                            values: "./alerta.yaml"
                        },
             */
            {
                namespace: "alerta",
                name: "mongodb",
                chart: "../../_chart/mongodb-11.2.0.tgz",
                //  repository: "https://charts.bitnami.com/bitnami",
                repository: "",
                version: "11.2.0",
                values: {
                    architecture: "replicaset",
                    auth: {
                        enabled: true,
                        rootUser: "root",
                        rootPassword: config.require("rootPassword"),
                        usernames: [],
                        passwords: [],
                        databases: [],
                        replicaSetKey: config.require("replicaSetKey"),
                    },
                    disableSystemLog: false,
                    replicaCount: 3,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "8192" }] },
                    resources: {
                        limits: { cpu: "200m", memory: "512Mi" },
                        requests: { cpu: "200m", memory: "512Mi" }
                    },
                    replicaSetName: "rs0",
                    persistence: { enabled: true, storageClass: "longhorn", size: "8Gi" },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    arbiter: { enabled: false },
                    metrics: {
                        enabled: false,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
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
                            prometheusRule: { enabled: false }
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
            skipAwait: true
        }, { dependsOn: [namespace] });
    }
}