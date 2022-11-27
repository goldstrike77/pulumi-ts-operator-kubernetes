import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "sonarqube",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "sonarqube",
                name: "postgresql",
                chart: "postgresql",
                repository: "https://charts.bitnami.com/bitnami",
                version: "12.1.2",
                values: {
                    image: {
                        tag: "13.9.0-debian-11-r1"
                    },
                    auth: {
                        postgresPassword: config.require("postgresPassword"),
                        username: "sonarqube",
                        password: config.require("userPassword"),
                        database: "sonarqube",
                    },
                    primary: {
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        persistence: { storageClass: "nfs-client", size: "8Gi" }
                    },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    metrics: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        serviceMonitor: {
                            enabled: true,
                            relabellings: [
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
                    }
                }
            },
            {
                namespace: "sonarqube",
                name: "sonarqube",
                chart: "sonarqube",
                repository: "https://charts.bitnami.com/bitnami",
                version: "2.0.1",
                values: {
                    image: { tag: "8.9.10-debian-11-r10" },
                    sonarqubeUsername: "user",
                    sonarqubePassword: config.require("sonarqubePassword"),
                    sonarqubeEmail: "user@example.com",
                    minHeapSize: "4096m",
                    maxHeapSize: "4096m",
                    extraProperties: [
                        "sonar.web.context=/sonarqube"
                    ],
                    replicaCount: 1,
                    resources: {
                        limits: { cpu: "2000m", memory: "6144Mi" },
                        requests: { cpu: "2000m", memory: "6144Mi" }
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    ingress: {
                        enabled: true,
                        ingressClassName: "nginx",
                        annotations: {
                            "nginx.ingress.kubernetes.io/rewrite-target": "/$1"
                        },
                        hostname: "norther.example.com",
                        path: "/sonarqube/?(.*)"
                    },
                    persistence: {
                        enabled: true,
                        storageClass: "nfs-client",
                        size: "10Gi"
                    },
                    sysctl: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    metrics: {
                        jmx: {
                            enabled: false,
                            resources: {
                                limits: { cpu: "100m", memory: "128Mi" },
                                requests: { cpu: "100m", memory: "128Mi" }
                            }
                        },
                        serviceMonitor: {
                            enabled: false,
                            relabellings: [
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        }
                    },
                    postgresql: { enabled: false },
                    externalDatabase: {
                        host: "postgresql",
                        user: "sonarqube",
                        password: config.require("userPassword"),
                        database: "sonarqube"
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