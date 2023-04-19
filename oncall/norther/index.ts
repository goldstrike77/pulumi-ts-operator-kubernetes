import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "oncall",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: {
            metadata: {
                name: "oncall-rabbitmq-external",
                namespace: "oncall",
                annotations: {},
                labels: {}
            },
            type: "Opaque",
            data: {
                "username": Buffer.from("admin").toString('base64'),
                "password": Buffer.from(config.require("rabbitmqPassword")).toString('base64')
            },
            stringData: {}
        },
        helm: [
            {
                namespace: "oncall",
                name: "oncall",
                chart: "oncall",
                repository: "https://grafana.github.io/helm-charts",
                version: "1.2.10",
                values: {
                    base_url: "norther.example.com",
                    image: {
                        repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/oncall",
                        tag: "v1.2.10"
                    },
                    engine: {
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        }
                    },
                    celery: {
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        }
                    },
                    env: [
                        {
                            name: "UWSGI_LISTEN",
                            value: "128"
                        }
                    ],
                    ingress: {
                        enabled: true,
                        annotations: {
                            "kubernetes.io/ingress.class": "nginx",
                            "nginx.ingress.kubernetes.io/rewrite-target": "/$2",
                            "nginx.ingress.kubernetes.io/configuration-snippet": "rewrite ^(/oncall)$ $1/ redirect;"
                        },
                        extraPaths: [
                            {
                                path: "/oncall(/|$)(.*)",
                                pathType: "Prefix",
                                backend: {
                                    service: {
                                        name: "oncall-engine",
                                        port: {
                                            name: "http"
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    "ingress-nginx": { enabled: false },
                    "cert-manager": { enabled: false },
                    database: { type: "mysql" },
                    mariadb: { enabled: false },
                    externalMysql: {
                        host: "mariadb",
                        port: "3306",
                        db_name: "oncall",
                        user: "oncall",
                        password: config.require("mysqlPassword")
                    },
                    rabbitmq: { enabled: false },
                    externalRabbitmq: {
                        host: "rabbitmq",
                        existingSecret: "oncall-rabbitmq-external"
                    },
                    redis: { enabled: false },
                    externalRedis: {
                        host: "redis-master",
                        password: config.require("redisPassword")
                    },
                    grafana: { enabled: false },
                    externalGrafana: {
                        url: "http://grafana.visualization.svc.cluster.local/grafana"
                    }
                }
            },
            {
                namespace: "oncall",
                name: "rabbitmq",
                chart: "rabbitmq",
                repository: "https://charts.bitnami.com/bitnami",
                version: "10.3.9",
                values: {
                    auth: {
                        username: "admin",
                        password: config.require("rabbitmqPassword"),
                    },
                    memoryHighWatermark: {
                        enabled: true,
                        type: "relative",
                        value: 0.4
                    },
                    clustering: { enabled: false },
                    extraConfiguration: `
disk_free_limit.absolute = 1GB
`,
                    replicaCount: 1,
                    podLabels: { customer: "demo", environment: "dev", project: "monitoring", group: "oncall", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "500m", memory: "1024Mi" },
                        requests: { cpu: "500m", memory: "1024Mi" }
                    },
                    persistence: {
                        enabled: true,
                        storageClass: "longhorn",
                        size: "8Gi"
                    },
                    metrics: {
                        enabled: true,
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
                            ]
                        },
                        prometheusRule: {
                            enabled: false
                        }
                    },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        },
                    }
                }
            },
            {
                namespace: "oncall",
                name: "redis",
                chart: "redis",
                repository: "https://charts.bitnami.com/bitnami",
                version: "17.7.1",
                values: {
                    architecture: "standalone",
                    auth: {
                        enabled: true,
                        sentinel: false,
                        password: config.require("redisPassword")
                    },
                    commonConfiguration: `appendonly no
maxmemory 256mb
tcp-keepalive 60
tcp-backlog 8192
maxclients 1000
bind 0.0.0.0
databases 4
save ""`,
                    master: {
                        resources: {
                            limits: { cpu: "200m", memory: "320Mi" },
                            requests: { cpu: "200m", memory: "320Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "monitoring", group: "oncall", datacenter: "dc01", domain: "local" },
                        podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "8192" }] },
                        persistence: { enabled: false }
                    },
                    metrics: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "monitoring", group: "oncall", datacenter: "dc01", domain: "local" },
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
                            relabellings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        }
                    },
                    sysctl: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    }
                }
            },
            {
                namespace: "oncall",
                name: "mariadb",
                chart: "mariadb",
                repository: "https://charts.bitnami.com/bitnami",
                version: "11.4.7",
                values: {
                    image: { tag: "10.6.12-debian-11-r3" },
                    architecture: "standalone",
                    auth: {
                        rootPassword: config.require("rootPassword"),
                        createDatabase: true,
                        database: "oncall",
                        username: "oncall",
                        password: config.require("mysqlPassword")
                    },
                    primary: {
                        configuration: `
[mysqld]
skip-name-resolve
explicit_defaults_for_timestamp
basedir=/opt/bitnami/mariadb
plugin_dir=/opt/bitnami/mariadb/plugin
port=3306
socket=/opt/bitnami/mariadb/tmp/mysql.sock
tmpdir=/opt/bitnami/mariadb/tmp
max_allowed_packet=16M
bind-address=0.0.0.0
pid-file=/opt/bitnami/mariadb/tmp/mysqld.pid
log-error=/opt/bitnami/mariadb/logs/mysqld.log
character-set-server=UTF8
collation-server=utf8_general_ci
slow_query_log=0
slow_query_log_file=/opt/bitnami/mariadb/logs/mysqld.log
slow_query_log=0
max_connections=100
performance_schema_max_table_instances=256
table_definition_cache=128
table_open_cache=128
innodb_buffer_pool_size=512M
innodb_flush_log_at_trx_commit=2
query_response_time_stats=1
plugin_load_add=query_response_time

[client]
port=3306
socket=/opt/bitnami/mariadb/tmp/mysql.sock
default-character-set=UTF8
plugin_dir=/opt/bitnami/mariadb/plugin

[manager]
port=3306
socket=/opt/bitnami/mariadb/tmp/mysql.sock
pid-file=/opt/bitnami/mariadb/tmp/mysqld.pid
`,
                        extraEnvVars: [
                            { name: "MARIADB_COLLATE", value: "utf8mb4_unicode_ci" },
                            { name: "MARIADB_CHARACTER_SET", value: "utf8mb4" }
                        ],
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        },
                        persistence: {
                            enabled: true,
                            storageClass: "longhorn",
                            size: "8Gi"
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "monitoring", group: "oncall", datacenter: "dc01", domain: "local" }
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
                        extraArgs: {
                            primary: [
                                "--collect.auto_increment.columns",
                                "--collect.binlog_size",
                                "--collect.engine_innodb_status",
                                "--collect.global_status",
                                "--collect.global_variables",
                                "--collect.info_schema.clientstats",
                                "--collect.info_schema.innodb_metrics",
                                "--collect.info_schema.innodb_cmp",
                                "--collect.info_schema.innodb_cmpmem",
                                "--collect.info_schema.processlist",
                                "--collect.info_schema.query_response_time",
                                "--collect.info_schema.tables",
                                "--collect.info_schema.tablestats",
                                "--collect.info_schema.schemastats",
                                "--collect.info_schema.userstats",
                                "--collect.perf_schema.eventsstatements",
                                "--collect.perf_schema.eventswaits",
                                "--collect.perf_schema.file_events",
                                "--collect.perf_schema.file_instances",
                                "--collect.perf_schema.indexiowaits",
                                "--collect.perf_schema.tableiowaits",
                                "--collect.perf_schema.tablelocks"
                            ]
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "256Mi" },
                            requests: { cpu: "100m", memory: "256Mi" }
                        },
                        livenessProbe: {
                            enabled: true,
                            initialDelaySeconds: 120,
                            periodSeconds: 10,
                            timeoutSeconds: 10,
                            successThreshold: 1,
                            failureThreshold: 3
                        },
                        readinessProbe: {
                            enabled: true,
                            initialDelaySeconds: 30,
                            periodSeconds: 10,
                            timeoutSeconds: 10,
                            successThreshold: 1,
                            failureThreshold: 3
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
                            ]
                        },
                        prometheusRule: {
                            enabled: false,
                            namespace: "",
                            rules: []
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
    // Create Kubernetes Secret.
    const secret = new k8s.core.v1.Secret(deploy_spec[i].secret.metadata.name, {
        metadata: deploy_spec[i].secret.metadata,
        type: deploy_spec[i].secret.type,
        data: deploy_spec[i].secret.data,
        stringData: deploy_spec[i].secret.stringData
    }, { dependsOn: [namespace] });
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