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
        secret: [
            {
                metadata: {
                    name: "archery-s3-credentials",
                    namespace: "archery",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "AWS_ACCESS_KEY_ID": Buffer.from(config.require("AWS_ACCESS_KEY_ID")).toString("base64"),
                    "AWS_SECRET_ACCESS_KEY": Buffer.from(config.require("AWS_SECRET_ACCESS_KEY")).toString("base64")
                },
                stringData: {}
            }
        ],
        crds: [
            {
                apiVersion: "pxc.percona.com/v1",
                kind: "PerconaXtraDBCluster",
                metadata: {
                    name: "archery",
                    namespace: "archery",
                    finalizers: ["delete-pxc-pods-in-order"]
                },
                spec: {
                    crVersion: "1.13.0",
                    pause: false,
                    pxc: {
                        size: 3,
                        image: "percona/percona-xtradb-cluster:8.0.31-23.2",
                        imagePullPolicy: "IfNotPresent",
                        autoRecovery: true,
                        expose: { "enabled": false },
                        configuration: `[mysqld]
skip-name-resolve
explicit_defaults_for_timestamp
max_allowed_packet=16M
character-set-server=utf8mb4
collation-server=utf8mb4_0900_ai_ci
slow_query_log=0
max_connections=100
performance_schema_max_table_instances=256
table_definition_cache=400
table_open_cache=128
innodb_buffer_pool_size=256M
innodb_flush_log_at_trx_commit=2
[sst]
xbstream-opts=--decompress
[xtrabackup]
compress=lz4
`,
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        },
                        affinity: { "antiAffinityTopologyKey": "kubernetes.io/hostname" },
                        volumeSpec: {
                            persistentVolumeClaim: {
                                storageClassName: "longhorn",
                                resources: {
                                    requests: {
                                        storage: "7G"
                                    }
                                }
                            }
                        }
                    },
                    haproxy: { enabled: false },
                    proxysql: { enabled: false },
                    logcollector: {
                        enabled: false,
                        image: "percona/percona-xtradb-cluster-operator:1.13.0-logcollector",
                        imagePullPolicy: "IfNotPresent",
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    pmm: { enabled: false },
                    backup: {
                        allowParallel: false,
                        image: "percona/percona-xtradb-cluster-operator:1.13.0-pxc8.0-backup-pxb8.0.32",
                        imagePullPolicy: "IfNotPresent",
                        storages: {
                            "minio": {
                                type: "s3",
                                verifyTLS: true,
                                s3: {
                                    endpointUrl: "http://node30.node.home.local:9000",
                                    bucket: "backup",
                                    credentialsSecret: "archery-s3-credentials",
                                    region: "us-west-2"
                                }
                            }
                        },
                        pitr: {
                            enabled: true,
                            storageName: "minio",
                            timeBetweenUploads: 300,
                            resources: {
                                limits: { cpu: "200m", memory: "256Mi" },
                                requests: { cpu: "200m", memory: "256Mi" }
                            }
                        },
                        schedule: [
                            {
                                name: "daily-backup",
                                schedule: pulumi.interpolate`${minutes.result} ${hours.result} * * *`,
                                keep: 2,
                                storageName: "minio"
                            }
                        ]
                    }
                }
            }
        ],
        helm: [
            //{
            //    namespace: "artifactory",
            //    name: "artifactory-oss",
            //    chart: "artifactory-oss",
            //    repository: "https://charts.jfrog.io",
            //    version: "107.55.8",
            //    values: {}
            //},
            {
                namespace: "archery",
                name: "archery-pxc-0",
                chart: "prometheus-mysql-exporter",
                repository: "https://prometheus-community.github.io/helm-charts",
                version: "2.0.0",
                values: {
                    fullnameOverride: "archery-pxc-0",
                    serviceMonitor: {
                        enabled: true,
                        interval: "60s",
                        scrapeTimeout: "30s",
                        namespace: "archery",
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
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "SQL-Audit", group: "archery", datacenter: "dc01", domain: "local" },
                    mysql: {
                        host: "archery-pxc-0.archery-pxc",
                        additionalConfig: ["connect-timeout=10"],
                        user: "monitor",
                        existingPasswordSecret: {
                            name: "archery-secrets",
                            key: "monitor"
                        }
                    }
                }
            },
            {
                namespace: "archery",
                name: "archery-pxc-1",
                chart: "prometheus-mysql-exporter",
                repository: "https://prometheus-community.github.io/helm-charts",
                version: "2.0.0",
                values: {
                    fullnameOverride: "archery-pxc-1",
                    serviceMonitor: {
                        enabled: true,
                        interval: "60s",
                        scrapeTimeout: "30s",
                        namespace: "archery",
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
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "SQL-Audit", group: "archery", datacenter: "dc01", domain: "local" },
                    mysql: {
                        host: "archery-pxc-1.archery-pxc",
                        additionalConfig: ["connect-timeout=10"],
                        user: "monitor",
                        existingPasswordSecret: {
                            name: "archery-secrets",
                            key: "monitor"
                        }
                    }
                }
            },
            {
                namespace: "archery",
                name: "archery-pxc-2",
                chart: "prometheus-mysql-exporter",
                repository: "https://prometheus-community.github.io/helm-charts",
                version: "2.0.0",
                values: {
                    fullnameOverride: "archery-pxc-2",
                    serviceMonitor: {
                        enabled: true,
                        interval: "60s",
                        scrapeTimeout: "30s",
                        namespace: "archery",
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
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "SQL-Audit", group: "archery", datacenter: "dc01", domain: "local" },
                    mysql: {
                        host: "archery-pxc-2.archery-pxc",
                        additionalConfig: ["connect-timeout=10"],
                        user: "monitor",
                        existingPasswordSecret: {
                            name: "archery-secrets",
                            key: "monitor"
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
    for (var secret_index in deploy_spec[i].secret) {
        const secret = new k8s.core.v1.Secret(deploy_spec[i].secret[secret_index].metadata.name, {
            metadata: deploy_spec[i].secret[secret_index].metadata,
            type: deploy_spec[i].secret[secret_index].type,
            data: deploy_spec[i].secret[secret_index].data,
            stringData: deploy_spec[i].secret[secret_index].stringData
        }, { dependsOn: [namespace] });
    }
    // Create postgresql CRD.
    for (var crd_index in deploy_spec[i].crds) {
        const rules = new k8s.apiextensions.CustomResource(deploy_spec[i].crds[crd_index].metadata.name, {
            apiVersion: deploy_spec[i].crds[crd_index].apiVersion,
            kind: deploy_spec[i].crds[crd_index].kind,
            metadata: deploy_spec[i].crds[crd_index].metadata,
            spec: deploy_spec[i].crds[crd_index].spec
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
}