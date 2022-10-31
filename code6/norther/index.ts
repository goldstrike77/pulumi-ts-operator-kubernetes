import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "code6",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "code6",
            chart: "mysql",
            repository: "https://charts.bitnami.com/bitnami",
            version: "9.4.1",
            values: {
                image: { tag: "5.7.40-debian-11-r6" },
                architecture: "standalone",
                auth: {
                    rootPassword: config.require("rootPassword"),
                    createDatabase: true,
                    database: "code6",
                    username: "code6",
                    password: config.require("userPassword")
                },
                primary: {
                    resources: {
                        limits: { cpu: "250m", memory: "512Mi" },
                        requests: { cpu: "250m", memory: "512Mi" }
                    },
                    persistence: {
                        enabled: true,
                        storageClass: "nfs-client",
                        size: "8Gi"
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" }
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
                    extraArgs: {
                        primary: ["--tls.insecure-skip-verify", "--collect.auto_increment.columns", "--collect.binlog_size", "--collect.engine_innodb_status", "--collect.global_status", "--collect.global_variables", "--collect.info_schema.clientstats", "--collect.info_schema.innodb_metrics", "--collect.info_schema.innodb_tablespaces", "--collect.info_schema.innodb_cmpmem", "--collect.info_schema.processlist", "--collect.info_schema.query_response_time", "--collect.info_schema.tables", "--collect.info_schema.tablestats", "--collect.info_schema.userstats", "--collect.perf_schema.eventsstatements", "--collect.perf_schema.eventswaits", "--collect.perf_schema.file_events", "--collect.perf_schema.file_instances", "--collect.perf_schema.indexiowaits", "--collect.perf_schema.tableiowaits", "--collect.perf_schema.tablelocks"]
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    livenessProbe: {
                        enabled: true,
                        initialDelaySeconds: 120,
                        periodSeconds: 10,
                        timeoutSeconds: 5,
                        successThreshold: 1,
                        failureThreshold: 3
                    },
                    readinessProbe: {
                        enabled: true,
                        initialDelaySeconds: 30,
                        periodSeconds: 10,
                        timeoutSeconds: 5,
                        successThreshold: 1,
                        failureThreshold: 3
                    },
                    serviceMonitor: {
                        enabled: true,
                        interval: "60s",
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
                        namespace: "",
                        rules: []
                    }
                }
            }
        },
        deployment: {
            metadata: {
                labels: {
                    app: "code6"
                },
                name: "code6",
                namespace: "code6"
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: {
                        app: "code6"
                    }
                },
                template: {
                    metadata: {
                        labels: {
                            app: "code6",
                            customer: "demo",
                            datacenter: "dc01",
                            domain: "local",
                            environment: "dev",
                            group: "norther",
                            project: "cluster"
                        }
                    },
                    spec: {
                        containers: [
                            {
                                image: "registry.cn-hangzhou.aliyuncs.com/goldstrike/code6:v1.6.2@sha256:ef4f2084887a301391b6966a988e6b0aab659c2ef14266e39dbcd3ee1e80f439",
                                name: "code6-server",
                                livenessProbe: {
                                    failureThreshold: 10,
                                    httpGet: {
                                        path: "/login",
                                        port: 80,
                                        scheme: "HTTP"
                                    },
                                    initialDelaySeconds: 60,
                                    periodSeconds: 10,
                                    successThreshold: 1,
                                    timeoutSeconds: 30
                                },
                                readinessProbe: {
                                    failureThreshold: 3,
                                    httpGet: {
                                        path: "/login",
                                        port: 80,
                                        scheme: "HTTP"
                                    },
                                    initialDelaySeconds: 60,
                                    periodSeconds: 10,
                                    successThreshold: 1,
                                    timeoutSeconds: 10
                                },
                                resources: {
                                    limits: { cpu: "200m", memory: "256Mi" },
                                    requests: { cpu: "200m", memory: "256Mi" }
                                },
                                ports: [
                                    {
                                        containerPort: 80,
                                        protocol: "TCP"
                                    }
                                ],
                                env: [
                                    { name: "MYSQL_HOST", value: "mysql" },
                                    { name: "MYSQL_PORT", value: "3306" },
                                    { name: "MYSQL_DATABASE", value: "code6" },
                                    { name: "MYSQL_USERNAME", value: "code6" },
                                    { name: "MYSQL_PASSWORD", value: config.require("userPassword") }
                                ]
                            }
                        ]
                    }
                }
            }
        },
        service: {
            metadata: {
                labels: {
                    app: "code6"
                },
                name: "code6",
                namespace: "code6"
            },
            spec: {
                ports: [
                    {
                        name: "code6",
                        port: 80,
                        protocol: "TCP",
                        targetPort: 80,
                    }
                ],
                selector: {
                    app: "code6",
                }
            }
        },
        ingress: {
            metadata: {
                annotations: {
                    "nginx.ingress.kubernetes.io/backend-protocol": "HTTP"
                },
                labels: {
                    app: "code6"
                },
                name: "code6",
                namespace: "code6"
            },
            spec: {
                ingressClassName: "nginx",
                rules: [
                    {
                        host: "code6.example.com",
                        http: {
                            paths: [
                                {
                                    backend: {
                                        service: {
                                            name: "code6",
                                            port: {
                                                number: 80,
                                            }
                                        }
                                    },
                                    path: "/",
                                    pathType: "Prefix",
                                }
                            ]
                        }
                    }
                ]
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
    const release = new k8s.helm.v3.Release(deploy_spec[i].helm.chart, {
        namespace: deploy_spec[i].helm.namespace,
        name: deploy_spec[i].helm.chart,
        chart: deploy_spec[i].helm.chart,
        version: deploy_spec[i].helm.version,
        values: deploy_spec[i].helm.values,
        skipAwait: false,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    }, { dependsOn: [namespace] });
    // Create Deployment Resource.
    const deployment = new k8s.apps.v1.Deployment(deploy_spec[i].deployment.metadata.name, {
        metadata: deploy_spec[i].deployment.metadata,
        spec: deploy_spec[i].deployment.spec
    }, { dependsOn: [release] });
    // Create Service Resource.
    const service = new k8s.core.v1.Service(deploy_spec[i].service.metadata.name, {
        metadata: deploy_spec[i].service.metadata,
        spec: deploy_spec[i].service.spec
    }, { dependsOn: [namespace] });
    // Create Ingress Resource.
    const ingress = new k8s.networking.v1.Ingress(deploy_spec[i].ingress.metadata.name, {
        metadata: deploy_spec[i].ingress.metadata,
        spec: deploy_spec[i].ingress.spec
    }, { dependsOn: [namespace] });
}