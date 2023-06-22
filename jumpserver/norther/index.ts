import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "jumpserver",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "jumpserver",
                name: "mariadb",
                chart: "mariadb",
                repository: "https://charts.bitnami.com/bitnami",
                version: "11.4.7",
                values: {
                    image: { tag: "10.6.12-debian-11-r26" },
                    architecture: "standalone",
                    auth: {
                        rootPassword: config.require("rootPassword"),
                        createDatabase: true,
                        database: "jumpserver",
                        username: "jumpserver",
                        password: config.require("userPassword")
                    },
                    primary: {
                        configuration: `
[mysqld]
skip-log-bin
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
slow_query_log_file=/opt/bitnami/mariadb/logs/mysqld.log
slow_query_log=0
max_connections=100
performance_schema_max_table_instances=256
table_definition_cache=400
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
                            size: "7Gi"
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "Management", group: "JumpServer", datacenter: "dc01", domain: "local" }
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
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
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
            },
            {
                namespace: "jumpserver",
                name: "redis",
                chart: "redis",
                repository: "https://charts.bitnami.com/bitnami",
                version: "17.11.3",
                values: {
                    architecture: "standalone",
                    auth: { enabled: false, sentinel: false },
                    commonConfiguration: `appendonly no
maxmemory 512mb
tcp-keepalive 60
tcp-backlog 8192
maxclients 1000
bind 0.0.0.0
databases 4
save ""`,
                    master: {
                        resources: {
                            limits: { cpu: "300m", memory: "576Mi" },
                            requests: { cpu: "300m", memory: "576Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "Management", group: "JumpServer", datacenter: "dc01", domain: "local" },
                        podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "8192" }] },
                        persistence: { enabled: false }
                    },
                    metrics: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "Management", group: "JumpServer", datacenter: "dc01", domain: "local" },
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