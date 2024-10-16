import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as random from "@pulumi/random";

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
                name: "mongodb",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "backup-conf-secret",
                    namespace: "mongodb",
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
                namespace: "mongodb",
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
                namespace: "mongodb",
                name: "customer",
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
                            name: "rs0",
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
        ],
        exporter: [
            {
                namespace: "mongodb",
                name: "customer-psmdb-db-rs0",
                chart: "prometheus-mongodb-exporter",
                repository: "https://prometheus-community.github.io/helm-charts",
                version: "3.1.2",
                size: 3,
                extraArgs: ["--collect-all"],
                user: "clusterMonitor",
                pass: config.require("clustermonitorPassword"),
                podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                resources: { limits: { cpu: "100m", memory: "128Mi" }, requests: { cpu: "100m", memory: "128Mi" } },
                serviceMonitor: {
                    enabled: true,
                    metricRelabelings: [
                        { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                        { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                        { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                        { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                        { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                        { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                    ]
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
    // Create Exporter pod.
    for (var exporter_index in deploy_spec[i].exporter) {
        for (let k = 0; k < deploy_spec[i].exporter[exporter_index].size; k++) {
            const release = new k8s.helm.v3.Release(`${deploy_spec[i].exporter[exporter_index].name}-` + k + "-exporter", {
                namespace: deploy_spec[i].exporter[exporter_index].namespace,
                name: `${deploy_spec[i].exporter[exporter_index].name}-` + k + "-exporter",
                chart: deploy_spec[i].exporter[exporter_index].chart,
                version: deploy_spec[i].exporter[exporter_index].version,
                values: {
                    extraArgs: deploy_spec[i].exporter[exporter_index].extraArgs,
                    mongodb: {
                        uri: "mongodb://" + deploy_spec[i].exporter[exporter_index].user + ":" + deploy_spec[i].exporter[exporter_index].pass + "@" + deploy_spec[i].exporter[exporter_index].name + "-" + k + "." + deploy_spec[i].exporter[exporter_index].name
                    },
                    nameOverride: "exporter",
                    podLabels: deploy_spec[i].exporter[exporter_index].podLabels,
                    resources: deploy_spec[i].exporter[exporter_index].resources,
                    serviceMonitor: deploy_spec[i].exporter[exporter_index].serviceMonitor
                },
                skipAwait: true,
                repositoryOpts: {
                    repo: deploy_spec[i].exporter[exporter_index].repository,
                },
            }, { dependsOn: [namespace] });
        }
    }
}