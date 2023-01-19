import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "yearning",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "yearning",
            chart: "mysql",
            repository: "https://charts.bitnami.com/bitnami",
            version: "9.4.1",
            values: {
                image: { tag: "5.7.40-debian-11-r6" },
                architecture: "standalone",
                auth: {
                    rootPassword: config.require("rootPassword"),
                    createDatabase: true,
                    database: "yearning",
                    username: "yearning",
                    password: config.require("userPassword")
                },
                primary: {
                    configuration: `
 [mysqld]
 default_authentication_plugin=mysql_native_password
 skip-name-resolve
 explicit_defaults_for_timestamp
 basedir=/opt/bitnami/mysql
 plugin_dir=/opt/bitnami/mysql/lib/plugin
 port=3306
 socket=/opt/bitnami/mysql/tmp/mysql.sock
 datadir=/bitnami/mysql/data
 tmpdir=/opt/bitnami/mysql/tmp
 max_allowed_packet=16M
 bind-address=*
 pid-file=/opt/bitnami/mysql/tmp/mysqld.pid
 log-error=/opt/bitnami/mysql/logs/mysqld.log
 character-set-server=utf8mb4
 collation-server=utf8mb4_general_ci
 slow_query_log=0
 slow_query_log_file=/opt/bitnami/mysql/logs/mysqld.log
 long_query_time=10.0
 
 [client]
 port=3306
 socket=/opt/bitnami/mysql/tmp/mysql.sock
 default-character-set=UTF8
 plugin_dir=/opt/bitnami/mysql/lib/plugin
 
 [manager]
 port=3306
 socket=/opt/bitnami/mysql/tmp/mysql.sock
 pid-file=/opt/bitnami/mysql/tmp/mysqld.pid
`,
                    resources: {
                        limits: { cpu: "250m", memory: "512Mi" },
                        requests: { cpu: "250m", memory: "512Mi" }
                    },
                    persistence: {
                        enabled: true,
                        storageClass: "longhorn",
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
                    app: "yearning"
                },
                name: "yearning",
                namespace: "yearning"
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: {
                        app: "yearning"
                    }
                },
                template: {
                    metadata: {
                        labels: {
                            app: "yearning",
                            customer: "demo",
                            datacenter: "dc01",
                            domain: "local",
                            environment: "dev",
                            group: "norther",
                            project: "cluster"
                        }
                    },
                    spec: {
                        initContainers: [
                            {
                                image: "chaiyd/yearning:v3.1.0",
                                name: "init",
                                command: ["/opt/Yearning"],
                                args: ["install"],
                                resources: {
                                    limits: { cpu: "100m", memory: "128Mi" },
                                    requests: { cpu: "100m", memory: "128Mi" }
                                },
                                env: [
                                    { name: "MYSQL_USER", value: "yearning" },
                                    { name: "MYSQL_PASSWORD", value: config.require("userPassword") },
                                    { name: "MYSQL_ADDR", value: "mysql" },
                                    { name: "MYSQL_DB", value: "yearning" },
                                    { name: "SECRET_KEY", value: config.require("secretkey") },
                                    { name: "IS_DOCKER", value: "is_docker" }
                                ]
                            }
                        ],
                        containers: [
                            {
                                image: "chaiyd/yearning:v3.1.0",
                                name: "yearning",
                                livenessProbe: {
                                    failureThreshold: 10,
                                    httpGet: {
                                        path: "/",
                                        port: 8000,
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
                                        path: "/",
                                        port: 8000,
                                        scheme: "HTTP"
                                    },
                                    initialDelaySeconds: 60,
                                    periodSeconds: 10,
                                    successThreshold: 1,
                                    timeoutSeconds: 10
                                },
                                resources: {
                                    limits: { cpu: "100m", memory: "128Mi" },
                                    requests: { cpu: "100m", memory: "128Mi" }
                                },
                                ports: [
                                    {
                                        containerPort: 8000,
                                        protocol: "TCP"
                                    }
                                ],
                                env: [
                                    { name: "MYSQL_USER", value: "yearning" },
                                    { name: "MYSQL_PASSWORD", value: config.require("userPassword") },
                                    { name: "MYSQL_ADDR", value: "mysql" },
                                    { name: "MYSQL_DB", value: "yearning" },
                                    { name: "SECRET_KEY", value: config.require("secretkey") },
                                    { name: "IS_DOCKER", value: "is_docker" }
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
                    app: "yearning"
                },
                name: "yearning",
                namespace: "yearning"
            },
            spec: {
                ports: [
                    {
                        name: "yearning",
                        port: 8000,
                        protocol: "TCP",
                        targetPort: 8000,
                    }
                ],
                selector: {
                    app: "yearning",
                }
            }
        },
        ingress: {
            metadata: {
                annotations: {
                    "nginx.ingress.kubernetes.io/backend-protocol": "HTTP"
                },
                labels: {
                    app: "yearning"
                },
                name: "yearning",
                namespace: "yearning"
            },
            spec: {
                ingressClassName: "nginx",
                rules: [
                    {
                        host: "yearning.example.com",
                        http: {
                            paths: [
                                {
                                    backend: {
                                        service: {
                                            name: "yearning",
                                            port: {
                                                number: 8000,
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