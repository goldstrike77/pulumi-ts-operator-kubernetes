import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "yapi",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "yapi",
                name: "mongodb",
                chart: "../../_chart/mongodb-13.1.4.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "",
                version: "13.1.4",
                values: {
                    image: { tag: "4.4.15-debian-10-r8" },
                    architecture: "standalone",
                    auth: {
                        enabled: true,
                        rootUser: "root",
                        rootPassword: config.require("rootPassword"),
                        usernames: ["yapi"],
                        passwords: [config.require("yapiPassword")],
                        databases: ["yapi"]
                    },
                    disableSystemLog: true,
                    updateStrategy: {
                        type: "RollingUpdate",
                        rollingUpdate: {
                            maxSurge: 0,
                            maxUnavailable: 1
                        }
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "10000" }] },
                    resources: {
                        limits: { cpu: "500m", memory: "1024Mi" },
                        requests: { cpu: "500m", memory: "1024Mi" }
                    },
                    livenessProbe: { initialDelaySeconds: 60, timeoutSeconds: 30 },
                    readinessProbe: { enabled: false },
                    persistence: { enabled: true, storageClass: "longhorn", size: "8Gi" },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                    },
                    metrics: {
                        enabled: false,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        livenessProbe: { initialDelaySeconds: 90, timeoutSeconds: 30 },
                        readinessProbe: { initialDelaySeconds: 90, timeoutSeconds: 30 },
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
                            relabelings: [
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
                namespace: "yapi",
                name: "yapi",
                chart: "../../_chart/yapi-2.0.0.tgz",
                // repository: "https://ygqygq2.github.io/charts",
                repository: "",
                version: "2.0.0",
                values: {
                    replicaCount: 1,
                    deploymentStrategy: {
                        rollingUpdate: {
                            maxSurge: 0,
                            maxUnavailable: 1
                        },
                        type: "RollingUpdate"
                    },
                    image: {
                        repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/yapi",
                        tag: "v1.8.0"
                    },
                    env: [
                        { name: "HOME", value: "/yapi" },
                        { name: "VENDORS", value: "/yapi/vendors" },
                        { name: "VERSION", value: "1.10.2" }
                    ],
                    secret: {
                        enabled: true,
                        data: {
                            "config.json": `{
    "port": "3000",
    "adminAccount": "admin@admin.com",
    "db": {
      "servername": "mongodb",
      "DATABASE": "yapi",
      "port": "27017",
      "user": "yapi",
      "pass": "password",
      "authSource": "yapi"
    },
    "mail": {
      "enable": false,
      "auth": {}
    },
    "ldapLogin": {
      "enable": false
    }
}
`
                        }
                    },
                    healthCheck: {
                        livenessInitialDelaySeconds: "120",
                        readinessInitialDelaySeconds: "120"
                    },
                    resources: {
                        limits: { cpu: "1000m", memory: "1024Mi" },
                        requests: { cpu: "1000m", memory: "1024Mi" }
                    },
                    labels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    persistentVolume: {
                        enabled: true,
                        storageClass: "longhorn",
                        size: "8Gi"
                    },
                    ingress: {
                        enabled: true,
                        annotations: { "kubernetes.io/ingress.class": "nginx" },
                        hosts: ["yapi.example.com"]
                    },
                    mongodb: { enabled: false }
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
        }, { dependsOn: [namespace] });
    }
}