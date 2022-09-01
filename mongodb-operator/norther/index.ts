import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "mongodb-operator",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "backup-conf-secret",
                    namespace: "mongodb-operator",
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
                namespace: "mongodb-operator",
                name: "psmdb-operator",
                chart: "psmdb-operator",
                repository: "https://percona.github.io/percona-helm-charts",
                version: "1.12.1",
                values: {
                    replicaCount: 1,
                    env: { resyncPeriod: "10s", logVerbose: false },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    }
                }
            },
/**
            {
                namespace: "mongodb-operator",
                name: "psmdb-db",
                chart: "psmdb-db",
                repository: "https://percona.github.io/percona-helm-charts",
                version: "1.12.3",
                values: {
                    finalizers: ["delete-psmdb-pods-in-order"],
                    upgradeOptions: {
                        versionServiceEndpoint: "https://check.percona.com",
                        apply: "disabled",
                        schedule: "0 2 * * *",
                        setFCV: false
                    },
                    imagePullPolicy: "IfNotPresent",
                    replsets: [
                        {
                            name: "rs0",
                            size: 1,
                            labels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                            storage: {
                                engine: "wiredTiger"
                            },
                            resources: {
                                limits: { cpu: "500m", memory: "1024Mi" },
                                requests: { cpu: "500m", memory: "1024Mi" }
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
                        }
                    },
                    users: {
                        MONGODB_BACKUP_USER: "backup",
                        MONGODB_BACKUP_PASSWORD: config.require("backupPassword"),
                        MONGODB_CLUSTER_ADMIN_USER: "clusterAdmin",
                        MONGODB_CLUSTER_ADMIN_PASSWORD: config.require("clusteradminPassword"),
                        MONGODB_USER_ADMIN_USER: "userAdmin",
                        MONGODB_USER_ADMIN_PASSWORD: config.require("useradminPassword")
                    }
                }
            }
             */
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