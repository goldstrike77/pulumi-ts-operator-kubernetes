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
        secrets: [
            {
                metadata: {
                    name: "default-admin-password",
                    namespace: "jumpserver",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "default-admin-password": Buffer.from(`#!/bin/bash
/usr/local/bin/python /opt/jumpserver/apps/manage.py shell <<EOF
from users.models import User
u = User.objects.get(username='admin')
u.reset_password('${config.require("adminPassword")}')
u.save
EOF
exit 0
`).toString('base64')
                },
                stringData: {}
            }
        ],
        job: {
            metadata: {
                name: "jumpserver-jms-admin-password",
                namespace: "jumpserver"
            },
            spec: {
                ttlSecondsAfterFinished: 60,
                template: {
                    spec: {
                        containers: [
                            {
                                name: "jumpserver-jms-admin-password",
                                image: "registry.cn-shanghai.aliyuncs.com/goldenimage/core:v2.28.16",
                                imagePullPolicy: "IfNotPresent",
                                command: ["/bin/bash", "-c", "/opt/jumpserver/default-admin-password"],
                                env: [
                                    { name: "SECRET_KEY", value: "0wjXLp7gjqYtcE1AfsFVN44vzVuo3a2wnmgpEA8wrVg3MnzKkf" },
                                    { name: "BOOTSTRAP_TOKEN", value: "4siuzoIzvgrbfBHcumCeGjkz" },
                                    { name: "DB_ENGINE", value: "mysql" },
                                    { name: "DB_HOST", value: "mariadb" },
                                    { name: "DB_PORT", value: "3306" },
                                    { name: "DB_USER", value: "jumpserver" },
                                    { name: "DB_PASSWORD", value: "password" },
                                    { name: "DB_NAME", value: "jumpserver" },
                                    { name: "REDIS_HOST", value: "redis-master" },
                                    { name: "REDIS_PORT", value: "6379" },
                                    { name: "REDIS_PASSWORD" }
                                ],
                                volumeMounts: [
                                    {
                                        mountPath: "/opt/jumpserver/config.yml",
                                        name: "jms-core-config",
                                        subPath: "config.yml"
                                    },
                                    {
                                        mountPath: "/opt/jumpserver/default-admin-password",
                                        name: "default-admin-password",
                                        subPath: "default-admin-password"
                                    }
                                ]
                            }
                        ],
                        volumes: [
                            {
                                name: "default-admin-password",
                                secret: {
                                    defaultMode: 493,
                                    secretName: "default-admin-password"
                                }
                            },
                            {
                                configMap: {
                                    defaultMode: 420,
                                    name: "jumpserver-jms-core"
                                },
                                name: "jms-core-config"
                            }
                        ],
                        restartPolicy: "Never"
                    }
                }
            }
        },
        jumpserver: {
            namespace: "jumpserver",
            name: "jumpserver",
            chart: "jumpserver",
            repository: "https://jumpserver.github.io/helm-charts",
            version: "3.4.0",
            values: {
                global: {
                    imageRegistry: "registry.cn-shanghai.aliyuncs.com",
                    imageTag: "v2.28.16",
                    storageClass: "nfs-client"
                },
                externalDatabase: {
                    engine: "mysql",
                    host: "mariadb",
                    port: 3306,
                    user: "jumpserver",
                    password: config.require("userPassword"),
                    database: "jumpserver"
                },
                externalRedis: {
                    host: "redis-master",
                    port: 6379
                },
                ingress: {
                    enabled: true,
                    annotations: {
                        "kubernetes.io/ingress.class": "nginx",
                        "nginx.ingress.kubernetes.io/proxy-body-size": "4096m",
                        "nginx.ingress.kubernetes.io/configuration-snippet": 'proxy_set_header Upgrade "websocket"; proxy_set_header Connection "Upgrade"; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;'
                    },
                    hosts: ["jumpserver.example.com"]
                },
                core: {
                    enabled: true,
                    config: {
                        secretKey: "0wjXLp7gjqYtcE1AfsFVN44vzVuo3a2wnmgpEA8wrVg3MnzKkf",
                        bootstrapToken: "4siuzoIzvgrbfBHcumCeGjkz",
                        debug: false,
                        log: { level: "ERROR" }
                    },
                    replicaCount: 1,
                    image: { repository: "goldenimage/core" },
                    resources: {
                        limits: { cpu: "2000m", memory: "4096Mi" },
                        requests: { cpu: "2000m", memory: "4096Mi" }
                    },
                    persistence: { size: "10Gi" }
                },
                koko: {
                    enabled: true,
                    replicaCount: 1,
                    image: { repository: "goldenimage/koko" },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    persistence: { size: "10Gi" }
                },
                lion: {
                    enabled: true,
                    replicaCount: 1,
                    image: { repository: "goldenimage/lion" },
                    resources: {
                        limits: { cpu: "100m", memory: "512Mi" },
                        requests: { cpu: "100m", memory: "512Mi" }
                    },
                    persistence: { size: "5Gi" }
                },
                magnus: {
                    enabled: true,
                    replicaCount: 1,
                    image: { repository: "goldenimage/magnus" },
                    resources: {
                        limits: { cpu: "100m", memory: "512Mi" },
                        requests: { cpu: "100m", memory: "512Mi" }
                    },
                    persistence: { size: "10Gi" }
                },
                omnidb: { replicaCount: 0 },
                razor: { replicaCount: 0 },
                video: { replicaCount: 0 },
                web: {
                    enabled: true,
                    replicaCount: 1,
                    image: { repository: "goldenimage/web" },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    persistence: { size: "10Gi" }
                }
            }
        },
        mariadb: {
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
                        { name: "MARIADB_COLLATE", value: "utf8mb3_general_ci" },
                        { name: "MARIADB_CHARACTER_SET", value: "utf8mb3" }
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
        redis: {
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
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create Kubernetes Secret.
    for (var secret_index in deploy_spec[i].secrets) {
        const secret = new k8s.core.v1.Secret(deploy_spec[i].secrets[secret_index].metadata.name, {
            metadata: deploy_spec[i].secrets[secret_index].metadata,
            type: deploy_spec[i].secrets[secret_index].type,
            data: deploy_spec[i].secrets[secret_index].data,
            stringData: deploy_spec[i].secrets[secret_index].stringData
        }, { dependsOn: [namespace] });
    }
    // Create Mariadb Release Resource.
    const mariadb = new k8s.helm.v3.Release(deploy_spec[i].mariadb.name, {
        namespace: deploy_spec[i].mariadb.namespace,
        name: deploy_spec[i].mariadb.name,
        chart: deploy_spec[i].mariadb.chart,
        version: deploy_spec[i].mariadb.version,
        values: deploy_spec[i].mariadb.values,
        skipAwait: false,
        repositoryOpts: {
            repo: deploy_spec[i].mariadb.repository,
        },
    }, { dependsOn: [namespace] });
    // Create Redis Release Resource.
    const redis = new k8s.helm.v3.Release(deploy_spec[i].redis.name, {
        namespace: deploy_spec[i].redis.namespace,
        name: deploy_spec[i].redis.name,
        chart: deploy_spec[i].redis.chart,
        version: deploy_spec[i].redis.version,
        values: deploy_spec[i].redis.values,
        skipAwait: false,
        repositoryOpts: {
            repo: deploy_spec[i].redis.repository,
        },
    }, { dependsOn: [namespace] });
    // Create Jumpserver Release Resource.
    const jumpserver = new k8s.helm.v3.Release(deploy_spec[i].jumpserver.name, {
        namespace: deploy_spec[i].jumpserver.namespace,
        name: deploy_spec[i].jumpserver.name,
        chart: deploy_spec[i].jumpserver.chart,
        version: deploy_spec[i].jumpserver.version,
        values: deploy_spec[i].jumpserver.values,
        skipAwait: false,
        repositoryOpts: {
            repo: deploy_spec[i].jumpserver.repository,
        },
    }, { dependsOn: [mariadb, redis] });
    // Create single job.
    const job = new k8s.batch.v1.Job(deploy_spec[i].job.metadata.name, {
        metadata: deploy_spec[i].job.metadata,
        spec: deploy_spec[i].job.spec
    }, { dependsOn: [jumpserver] });
}