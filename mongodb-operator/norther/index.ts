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
                    "access-key-id": "R0E4MUNFNlJNTEFaWjhFVEVaQ0c=",
                    "secret-access-key": config.require("secretaccesskey")
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
                version: "1.12.1",
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
                name: "alerta",
                chart: "psmdb-db",
                repository: "https://percona.github.io/percona-helm-charts",
                version: "1.12.4",
                values: {
                    finalizers: ["delete-psmdb-pods-in-order"],
                    upgradeOptions: { apply: "disabled" },
                    image: { tag: "4.2.22-22" },
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
                                    insecureSkipTLSVerify: true,
                                    credentialsSecret: "backup-conf-secret"
                                }
                            }
                        },
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
                        MONGODB_CLUSTER_ADMIN_USER: "clusterAdmin",
                        MONGODB_CLUSTER_ADMIN_PASSWORD: config.require("clusteradminPassword"),
                        MONGODB_CLUSTER_MONITOR_USER: "clusterMonitor",
                        MONGODB_CLUSTER_MONITOR_PASSWORD: config.require("clustermonitorPassword"),
                        MONGODB_USER_ADMIN_USER: "userAdmin",
                        MONGODB_USER_ADMIN_PASSWORD: config.require("useradminPassword")
                    }
                }
            }
        ],
        exporter: [
            {
                namespace: "mongodb",
                name: "alerta-psmdb-db-rs0",
                chart: "prometheus-mongodb-exporter",
                repository: "https://prometheus-community.github.io/helm-charts",
                version: "3.1.1",
                size: 3,
                extraArgs: ["--collect.collection", "--collect.database", "--collect.indexusage", "--collect.topmetrics"],
                user: "clusterMonitor",
                pass: config.require("clustermonitorPassword"),
                podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                resources: { limits: { cpu: "100m", memory: "128Mi" }, requests: { cpu: "100m", memory: "128Mi" } },
                serviceMonitor: {
                    enabled: false,
                    targetLabels: []
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
        for (let i = 0; i < deploy_spec[i].exporter[exporter_index].size; i++) {
            const release = new k8s.helm.v3.Release(`${deploy_spec[i].exporter[exporter_index].name}-` + i, {
                namespace: deploy_spec[i].exporter[exporter_index].namespace,
                name: `${deploy_spec[i].exporter[exporter_index].name}-` + i,
                chart: deploy_spec[i].exporter[exporter_index].chart,
                version: deploy_spec[i].exporter[exporter_index].version,
                values: {
                    extraArgs: deploy_spec[i].exporter[exporter_index].extraArgs,
                    mongodb: {
                        uri: `mongodb://$(deploy_spec[i].exporter[exporter_index].user):$(deploy_spec[i].exporter[exporter_index].pass)@$(deploy_spec[i].exporter[exporter_index].name)-$i`
                    },
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