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
                version: "12.2.5",
                values: {
                    global: {
                        storageClass: "longhorn",
                        postgresql: {
                            auth: {
                                postgresPassword: config.require("postgresPassword"),
                                username: "sonarqube",
                                password: config.require("userPassword"),
                                database: "sonarqube"
                            }
                        }
                    },
                    image: {
                        debug: false
                    },
                    architecture: "standalone",
                    primary: {
                        pgHbaConfiguration: `
local all all trust
host all all localhost trust
host sonarqube sonarqube 10.244.0.0/16 md5
`,
                        initdb: {
                            user: "sonarqube",
                            password: config.require("userPassword"),
                        },
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "SelfManaged", group: "Sonarqube", datacenter: "dc01", domain: "local" },
                        persistence: {
                            size: "8Gi"
                        }
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
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        serviceMonitor: {
                            enabled: true,
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
                    }
                }
            },
            {
                namespace: "sonarqube",
                name: "sonarqube",
                chart: "sonarqube",
                repository: "https://charts.bitnami.com/bitnami",
                version: "2.1.4",
                values: {
                    sonarqubeUsername: "admin",
                    sonarqubePassword: config.require("sonarqubePassword"),
                    minHeapSize: "4096m",
                    maxHeapSize: "4096m",
                    extraEnvVars: [
                        { name: "SONAR_WEB_CONTEXT", value: "/sonarqube" }
                    ],
                    replicaCount: 1,
                    customLivenessProbe: {
                        failureThreshold: 6,
                        httpGet: {
                            path: "/sonarqube",
                            port: "http",
                            scheme: "HTTP"
                        },
                        initialDelaySeconds: 100,
                        periodSeconds: 10,
                        successThreshold: 1,
                        timeoutSeconds: 5
                    },
                    customReadinessProbe: {
                        failureThreshold: 6,
                        httpGet: {
                            path: "/sonarqube",
                            port: "http",
                            scheme: "HTTP"
                        },
                        initialDelaySeconds: 100,
                        periodSeconds: 10,
                        successThreshold: 1,
                        timeoutSeconds: 5
                    },
                    resources: {
                        limits: { cpu: "2000m", memory: "6144Mi" },
                        requests: { cpu: "2000m", memory: "6144Mi" }
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "SelfManaged", group: "Sonarqube", datacenter: "dc01", domain: "local" },
                    service: {
                        type: "LoadBalancer",
                        annotations: {}
                    },
                    ingress: {
                        enabled: true,
                        ingressClassName: "nginx",
                        annotations: {},
                        hostname: "norther.example.com",
                        path: "/sonarqube"
                    },
                    persistence: {
                        enabled: false,
                        storageClass: "",
                        size: "10Gi"
                    },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    },
                    sysctl: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    },
                    metrics: {
                        jmx: {
                            enabled: true,
                            resources: {
                                limits: { cpu: "100m", memory: "128Mi" },
                                requests: { cpu: "100m", memory: "128Mi" }
                            }
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