import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

let config = new pulumi.Config();

// Generate random minutes from 10 to 59.
const minutes = new random.RandomInteger("minutes", {
    seed: `${pulumi.getStack()}-${pulumi.getProject()}`,
    max: 59,
    min: 10,
});

// Generate random hours from UTC 17 to 21.
const hours = new random.RandomInteger("hours", {
    seed: `${pulumi.getStack()}-${pulumi.getProject()}`,
    max: 21,
    min: 17,
});

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "archery",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        configmap: {
            metadata: {
                name: "archery-redis-config",
                namespace: "archery",
                annotations: {},
                labels: {}
            },
            data: {
                "redis-additional.conf": `appendonly no
maxmemory 200mb
tcp-keepalive 300
tcp-backlog 8192
maxclients 1000
databases 1
save ""
`
            }
        },
        secret: {
            metadata: {
                name: "archery-credentials",
                namespace: "archery",
                annotations: {},
                labels: {}
            },
            type: "Opaque",
            data: {
                "mysql-root-password": Buffer.from(config.require("MYSQL_ROOT_PASSWORD")).toString('base64'),
                "mysql-user-password": Buffer.from(config.require("MYSQL_USER_PASSWORD")).toString('base64'),
                "redis-password": Buffer.from(config.require("REDIS_PASSWORD")).toString("base64")
            },
            stringData: {}
        },
        crds: [
            {
                apiVersion: "mariadb.mmontes.io/v1alpha1",
                kind: "User",
                metadata: {
                    name: "mariadb-user",
                    namespace: "archery"
                },
                spec: {
                    name: "archery",
                    mariaDbRef: {
                        name: "mariadb"
                    },
                    passwordSecretKeyRef: {
                        name: "archery-credentials",
                        key: "mysql-user-password"
                    },
                    maxUserConnections: 20,
                    host: "%",
                    retryInterval: "10s"
                }
            },
            {
                apiVersion: "mariadb.mmontes.io/v1alpha1",
                kind: "Grant",
                metadata: {
                    name: "mariadb-grant",
                    namespace: "archery"
                },
                spec: {
                    mariaDbRef: {
                        name: "mariadb"
                    },
                    privileges: ["ALL PRIVILEGES"],
                    database: "archery",
                    table: "*",
                    username: "archery",
                    grantOption: true,
                    host: "%",
                    retryInterval: "10s"
                }
            },
            {
                apiVersion: "mariadb.mmontes.io/v1alpha1",
                kind: "Database",
                metadata: {
                    name: "mariadb-database",
                    namespace: "archery"
                },
                spec: {
                    name: "archery",
                    mariaDbRef: {
                        name: "mariadb"
                    },
                    characterSet: "utf8",
                    collate: "utf8_general_ci",
                    retryInterval: "10s"
                }
            },
            {
                apiVersion: "mariadb.mmontes.io/v1alpha1",
                kind: "Backup",
                metadata: {
                    name: "mariadb-backup",
                    namespace: "archery",
                },
                spec: {
                    mariaDbRef: {
                        name: "mariadb"
                    },
                    schedule: {
                        cron: pulumi.interpolate`${minutes.result} ${hours.result} * * *`,
                        suspend: false
                    },
                    maxRetentionDays: 3,
                    storage: {
                        volume: {
                            nfs: {
                                server: "node30.node.home.local",
                                path: "/data/nfs/archery"
                            }
                        }
                    },
                    resources: {
                        limits: { cpu: "200m", memory: "128Mi" },
                        requests: { cpu: "200m", memory: "128Mi" }
                    }
                }
            },
            {
                apiVersion: "mariadb.mmontes.io/v1alpha1",
                kind: "MariaDB",
                metadata: {
                    name: "archery-mysql",
                    namespace: "archery"
                },
                spec: {
                    rootPasswordSecretKeyRef: {
                        name: "archery-credentials",
                        key: "mysql-root-password"
                    },
                    database: "archery",
                    username: "archery",
                    passwordSecretKeyRef: {
                        name: "archery-credentials",
                        key: "mysql-user-password"
                    },
                    image: "mariadb:10.11.5",
                    imagePullPolicy: "IfNotPresent",
                    port: 3306,
                    replicas: 1,
                    galera: { enabled: false },
                    service: {
                        type: "ClusterIP",
                    },
                    myCnf: `[mariadb]
bind-address=*
binlog_format=row
default_storage_engine=InnoDB
expire_logs_days=5
innodb_autoinc_lock_mode=2
innodb_buffer_pool_size=256M
innodb_flush_log_at_trx_commit=1
max_allowed_packet=256M
max_connections=100
performance_schema_max_table_instances=256
plugin_load_add=query_response_time
query_response_time_stats=1
skip-name-resolve
slow_query_log=0
table_definition_cache=400
table_open_cache=128
`,
                    resources: {
                        limits: { cpu: "500m", memory: "512Mi" },
                        requests: { cpu: "500m", memory: "512Mi" }
                    },
                    volumeClaimTemplate: {
                        storageClassName: "longhorn",
                        resources: {
                            requests: {
                                storage: "7Gi"
                            }
                        },
                        accessModes: [
                            "ReadWriteOnce"
                        ]
                    },
                    metrics: {
                        exporter: {
                            image: "prom/mysqld-exporter:v0.14.0",
                            resources: {
                                limits: { cpu: "50m", memory: "64Mi" },
                                requests: { cpu: "50m", memory: "64Mi" }
                            },
                            port: 9104
                        }
                    }
                }
            },
            {
                apiVersion: "redis.redis.opstreelabs.in/v1beta2",
                kind: "Redis",
                metadata: {
                    name: "archery-redis",
                    namespace: "archery",
                },
                spec: {
                    redisConfig: {
                        additionalRedisConfig: "archery-redis-config"
                    },
                    kubernetesConfig: {
                        image: "quay.io/opstree/redis:v7.0.12",
                        imagePullPolicy: "IfNotPresent",
                        redisSecret: {
                            name: "archery-credentials",
                            key: "redis-password"
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "256Mi" },
                            requests: { cpu: "100m", memory: "256Mi" }
                        }
                    },
                    redisExporter: {
                        enabled: true,
                        image: "quay.io/opstree/redis-exporter:v1.44.0",
                        imagePullPolicy: "IfNotPresent",
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    }
                }
            },
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "archery-redis",
                    namespace: "archery"
                },
                spec: {
                    podMetricsEndpoints: [
                        {
                            interval: "60s",
                            scrapeTimeout: "30s",
                            scheme: "http",
                            targetPort: "redis-exporter",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { action: "replace", replacement: "demo", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "dev", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "SQL-Audit", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "archery", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "dc01", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["archery"]
                    },
                    selector: {
                        matchLabels: {
                            "app": "archery-redis"
                        }
                    }
                }
            }
        ],
        helm: {
            namespace: "archery",
            name: "archery",
            chart: "archery",
            repository: "https://douban.github.io/charts/",
            version: "0.3.2",
            values: {
                replicaCount: 1,
                image: {
                    repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/archery",
                    tag: "v1.10.0",
                    pullPolicy: "IfNotPresent"
                },
                fullnameOverride: "",
                ingress: {
                    enabled: true,
                    className: "nginx",
                    hosts: ["archery.example.com"]
                },
                redis: {
                    embedded: false,
                    url: "redis://archery-redis:6379/0",
                    auth: {
                        password: config.require("REDIS_PASSWORD")
                    }
                },
                mysql: {
                    embedded: false,
                    url: pulumi.interpolate`mysql://archery:${config.require("MYSQL_ROOT_PASSWORD")}@archery-mysql:3306/archery`
                },
                goinception: {
                    embedded: true,
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    },
                },
                resources: {
                    limits: { cpu: "1000m", memory: "1024Mi" },
                    requests: { cpu: "1000m", memory: "1024Mi" }
                },
                envs: [
                    { name: "CSRF_TRUSTED_ORIGINS", value: "https://*.example.com" }
                ],
                configMap: {
                    enabled: true,
                    superuser: {
                        username: "admin",
                        password: config.require("ARCHERY_PASSWORD"),
                        email: "archery@example.com"
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
    // Create Kubernetes ConfigMap.
    const configmap = new k8s.core.v1.ConfigMap(deploy_spec[i].configmap.metadata.name, {
        metadata: deploy_spec[i].configmap.metadata,
        data: deploy_spec[i].configmap.data,
    }, { dependsOn: [namespace] });
    // Create Kubernetes Secret.
    const secret = new k8s.core.v1.Secret(deploy_spec[i].secret.metadata.name, {
        metadata: deploy_spec[i].secret.metadata,
        type: deploy_spec[i].secret.type,
        data: deploy_spec[i].secret.data,
        stringData: deploy_spec[i].secret.stringData
    }, { dependsOn: [namespace] });
    // Create Database CRDs.
    for (var crd_index in deploy_spec[i].crds) {
        const rules = new k8s.apiextensions.CustomResource(deploy_spec[i].crds[crd_index].metadata.name, {
            apiVersion: deploy_spec[i].crds[crd_index].apiVersion,
            kind: deploy_spec[i].crds[crd_index].kind,
            metadata: deploy_spec[i].crds[crd_index].metadata,
            spec: deploy_spec[i].crds[crd_index].spec
        }, { dependsOn: [configmap, secret] });
    }
    // Create Release Resource.
    const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
        namespace: deploy_spec[i].helm.namespace,
        name: deploy_spec[i].helm.name,
        chart: deploy_spec[i].helm.chart,
        version: deploy_spec[i].helm.version,
        values: deploy_spec[i].helm.values,
        skipAwait: true,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    }, { dependsOn: [configmap, secret] });
}