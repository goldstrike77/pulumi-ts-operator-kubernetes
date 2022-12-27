import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "spring-boot",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "spring-boot",
            chart: "mysql",
            repository: "https://charts.bitnami.com/bitnami",
            version: "9.4.1",
            values: {
                image: { tag: "5.7.40-debian-11-r6" },
                architecture: "standalone",
                auth: {
                    rootPassword: config.require("rootPassword"),
                    createDatabase: true,
                    database: "spring-boot",
                    username: "spring-boot",
                    password: config.require("userPassword")
                },
                initdbScripts: {
                    "my_init_script.sh": `
#!/bin/bash
mysql -uroot -p${config.require("rootPassword")} -e "use spring-boot;CREATE TABLE pet (name VARCHAR(20), owner VARCHAR(20), species VARCHAR(20), sex CHAR(1), birth DATE, death DATE);"
mysql -uroot -p${config.require("rootPassword")} -e "use spring-boot;INSERT INTO pet VALUES ('Puffball','Diane','hamster','f','1999-03-30',NULL);"
`
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
                    enabled: false,
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    }
                },
                metrics: {
                    enabled: false,
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
                    app: "spring-boot"
                },
                name: "spring-boot",
                namespace: "spring-boot"
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: {
                        app: "spring-boot"
                    }
                },
                template: {
                    metadata: {
                        labels: {
                            app: "spring-boot",
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
                                image: "registry.cn-hangzhou.aliyuncs.com/goldstrike/spring-boot-kubernetes-mysql:4.2.0",
                                name: "spring-boot",
                                livenessProbe: {
                                    failureThreshold: 10,
                                    tcpSocket: {
                                        port: 8778
                                    },
                                    initialDelaySeconds: 60,
                                    periodSeconds: 10,
                                    successThreshold: 1,
                                    timeoutSeconds: 30
                                },
                                readinessProbe: {
                                    failureThreshold: 3,
                                    tcpSocket: {
                                        port: 8778
                                    },
                                    initialDelaySeconds: 60,
                                    periodSeconds: 10,
                                    successThreshold: 1,
                                    timeoutSeconds: 10
                                },
                                resources: {
                                    limits: { cpu: "500m", memory: "256Mi" },
                                    requests: { cpu: "500m", memory: "256Mi" }
                                },
                                ports: [
                                    {
                                        containerPort: 8080,
                                        name: "http",
                                        protocol: "TCP"
                                    },
                                    {
                                        containerPort: 9779,
                                        name: "prometheus",
                                        protocol: "TCP"
                                    },
                                    {
                                        containerPort: 8778,
                                        name: "jolokia",
                                        protocol: "TCP"
                                    }
                                ],
                                env: [
                                    { name: "SPRING_DATASOURCE_URL", value: "jdbc:mysql://mysql/spring-boot" },
                                    { name: "SPRING_DATASOURCE_USERNAME", value: "spring-boot" },
                                    { name: "SPRING_DATASOURCE_PASSWORD", value: config.require("userPassword") },
                                    { name: "KUBERNETES_NAMESPACE", value: "spring-boot" },
                                    { name: "HOSTNAME", value: "spring-boot-kubernetes-mysql" }
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
                    app: "spring-boot"
                },
                name: "spring-boot",
                namespace: "spring-boot"
            },
            spec: {
                ports: [
                    {
                        name: "spring-boot",
                        port: 8778,
                        protocol: "TCP",
                        targetPort: 8778,
                    }
                ],
                selector: {
                    app: "spring-boot",
                }
            }
        },
        ingress: {
            metadata: {
                annotations: {
                    "nginx.ingress.kubernetes.io/backend-protocol": "HTTPS"
                },
                labels: {
                    app: "spring-boot"
                },
                name: "spring-boot",
                namespace: "spring-boot"
            },
            spec: {
                ingressClassName: "nginx",
                rules: [
                    {
                        host: "spring-boot.example.com",
                        http: {
                            paths: [
                                {
                                    backend: {
                                        service: {
                                            name: "spring-boot",
                                            port: {
                                                number: 8778,
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