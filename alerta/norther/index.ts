import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as random from "@pulumi/random";

const random = new random.RandomString("random", {
    length: 16,
    overrideSpecial: "/@£$",
    special: true,
});

const randomsecretkey = new random.RandomString("randomsecretkey", {
    keepers: { project: `${pulumi.getStack()}-${pulumi.getProject()}` },
    length: 32,
    special: false,
});

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

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "alerta",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "backup-conf-secret",
                    namespace: "alerta",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "AWS_ACCESS_KEY_ID": Buffer.from("backup").toString('base64'),
                    "AWS_SECRET_ACCESS_KEY": Buffer.from(config.require("AWS_SECRET_ACCESS_KEY")).toString('base64')
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "alerta",
                name: "alerta",
                chart: "../../_chart/alerta.tgz",
                repository: "",
                version: "0.1",
                values: {
                    replicaCount: 1,
                    image: {
                        repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/alerta-web",
                        tag: "8.7.0"
                    },
                    ingress: {
                        enabled: true,
                        annotations: { "kubernetes.io/ingress.class": "nginx" },
                        hosts: ["alerta.example.com"]
                    },
                    resources: {
                        limits: { cpu: "1000m", memory: "1024Mi" },
                        requests: { cpu: "1000m", memory: "1024Mi" }
                    },
                    alertaAdminPassword: config.require("alertaAdminPassword"),
                    alertaAdminUsers: ["admin@alerta.io"],
                    alertaInstallPlugins: ["prometheus"],
                    alertaConfig: {
                        DATABASE_URL: "'mongodb://alerta:password@mongodb-0:27017,mongodb-1:27017,mongodb-2:27017/alerta?replicaSet=rs0-alerta&connectTimeoutMS=300000&tls=true&tlsAllowInvalidCertificates=true'",
                        DATABASE_NAME: "'alerta'",
                        DATABASE_RAISE_ON_ERROR: "False",
                        DELETE_EXPIRED_AFTER: 60,
                        DELETE_INFO_AFTER: 60,
                        COLUMNS: "['severity', 'status', 'type', 'lastReceiveTime', 'duplicateCount', 'customer', 'environment', 'group', 'resource', 'service', 'text']",
                        CORS_ORIGINS: "['https://alerta.example.com']",
                        AUTH_REQUIRED: "True",
                        SECRET_KEY: pulumi.interpolate`'${randomsecretkey.result}'`,
                        CUSTOMER_VIEWS: "True",
                        BASE_URL: "''",
                        USE_PROXYFIX: "False",
                        AUTH_PROVIDER: "'basic'",
                        ADMIN_USERS: "['admin@alerta.io']",
                        SIGNUP_ENABLED: "False",
                        SITE_LOGO_URL: "''",
                        SEVERITY_MAP: "{'critical':1,'high':2,'warning':3,'info':4,'ok':5}",
                        DEFAULT_NORMAL_SEVERITY: "'ok'",
                        DEFAULT_PREVIOUS_SEVERITY: "'ok'",
                        COLOR_MAP: "{'severity':{'critical':'red','high':'yellow','warning':'gray','info':'white','ok':'#00CC00'},'text':'black','highlight':'skyblue'}",
                        DEBUG: "False",
                        LOG_HANDLERS: "['console']",
                        LOG_FORMAT: "'verbose'",
                        ALLOWED_ENVIRONMENTS: "['dev', 'development', 'disaster', 'drs', 'prd', 'nprd', 'production', 'qa', 'sit', 'testing', 'uat']",
                        DEFAULT_ENVIRONMENT: "'dev'",
                        PLUGINS: "['prometheus']",
                        PLUGINS_RAISE_ON_ERROR: "False",
                        ALERTMANAGER_API_URL: "'demo-prd-infra-monitor-alertmanager.service.dc01.local:9093'",
                        ALERTMANAGER_SILENCE_DAYS: 5,
                        ALERTMANAGER_SILENCE_FROM_ACK: "True"
                    },
                    postgresql: { enabled: false }
                }
            },
            {
                namespace: "alerta",
                name: "psmdb-operator",
                chart: "psmdb-operator",
                repository: "https://percona.github.io/percona-helm-charts",
                version: "1.13.2",
                values: {
                    replicaCount: 2,
                    fullnameOverride: "mongodb-operator",
                    env: { resyncPeriod: "10s", logVerbose: false },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    }
                }
            },
            {
                namespace: "alerta",
                name: "psmdb-db",
                chart: "psmdb-db",
                repository: "https://percona.github.io/percona-helm-charts",
                version: "1.13.0",
                values: {
                    finalizers: ["delete-psmdb-pods-in-order"],
                    upgradeOptions: { apply: "disabled" },
                    image: { tag: "4.4.16-16" },
                    pmm: { enabled: false },
                    imagePullPolicy: "IfNotPresent",
                    replsets: [
                        {
                            name: "rs0-alerta",
                            size: 3,
                            configuration: `
systemLog:
verbosity: 0
quiet: true
auditLog:
destination: console
filter: '{ atype: { $in: [ "addShard", "createCollection", "createDatabase", "createIndex", "createRole", "createUser", "dropAllRolesFromDatabase", "dropAllUsersFromDatabase", "dropCollection", "dropDatabase", "dropIndex", "dropRole", "dropUser", "enableSharding", "grantPrivilegesToRole", "grantRolesToRole", "grantRolesToUser", "removeShard", "renameCollection", "replSetReconfig", "revokePrivilegesFromRole", "revokeRolesFromRole", "revokeRolesFromUser", "shardCollection", "shutdown", "updateRole", "updateUser" ] } }'
`,
                            labels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                            storage: {
                                engine: "wiredTiger",
                                wiredTiger: {
                                    engineConfig: {
                                        cacheSizeRatio: 0.5,
                                        directoryForIndexes: true,
                                        journalCompressor: "snappy"
                                    }
                                }
                            },
                            resources: {
                                limits: { cpu: "300m", memory: "512Mi" },
                                requests: { cpu: "300m", memory: "512Mi" }
                            },
                            volumeSpec: {
                                pvc: {
                                    storageClassName: "longhorn",
                                    resources: {
                                        requests: { storage: "8Gi" }
                                    }
                                }
                            }
                        }
                    ],
                    sharding: { enabled: false },
                    backup: {
                        enabled: true,
                        image: { tag: "1.8.1" },
                        resources: {
                            limits: { cpu: "300m", memory: "512Mi" },
                            requests: { cpu: "300m", memory: "512Mi" }
                        },
                        storages: {
                            minio: {
                                type: "s3",
                                s3: {
                                    bucket: "backup",
                                    prefix: "mongodb",
                                    region: "us-east-1",
                                    endpointUrl: "http://minio.minio.svc.cluster.local:9000",
                                    credentialsSecret: "backup-conf-secret"
                                }
                            }
                        },
                        pitr: { enabled: true },
                        tasks: [
                            {
                                name: "daily-s3-us-east-1",
                                enabled: true,
                                schedule: pulumi.interpolate`${minutes.result} ${hours.result} * * *`,
                                keep: 3,
                                storageName: "minio",
                                compressionType: "gzip"
                            }
                        ]
                    },
                    users: {
                        MONGODB_BACKUP_USER: "backup",
                        MONGODB_BACKUP_PASSWORD: config.require("backupPassword"),
                        MONGODB_DATABASE_ADMIN_USER: "databaseAdmin",
                        MONGODB_DATABASE_ADMIN_PASSWORD: config.require("databaseAdminPassword"),
                        MONGODB_CLUSTER_ADMIN_USER: "clusterAdmin",
                        MONGODB_CLUSTER_ADMIN_PASSWORD: config.require("clusterAdminPassword"),
                        MONGODB_CLUSTER_MONITOR_USER: "clusterMonitor",
                        MONGODB_CLUSTER_MONITOR_PASSWORD: config.require("clusterMonitorPassword"),
                        MONGODB_USER_ADMIN_USER: "userAdmin",
                        MONGODB_USER_ADMIN_PASSWORD: config.require("userAdminPassword")
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
    for (var secret_index in deploy_spec[i].secret) {
        const secret = new k8s.core.v1.Secret(deploy_spec[i].secret[secret_index].metadata.name, {
            metadata: deploy_spec[i].secret[secret_index].metadata,
            type: deploy_spec[i].secret[secret_index].type,
            data: deploy_spec[i].secret[secret_index].data,
            stringData: deploy_spec[i].secret[secret_index].stringData
        }, { dependsOn: [namespace] });
    }
    // Create Release Resource.
    for (var helm_index in deploy_spec[i].helm) {
        if (deploy_spec[i].helm[helm_index].repository === "") {
            const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
                namespace: deploy_spec[i].helm[helm_index].namespace,
                name: deploy_spec[i].helm[helm_index].name,
                chart: deploy_spec[i].helm[helm_index].chart,
                version: deploy_spec[i].helm[helm_index].version,
                values: deploy_spec[i].helm[helm_index].values,
                skipAwait: true,
            }, { dependsOn: [namespace] });
        }
        else {
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
}