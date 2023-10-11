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
                name: "artifactory",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "artifactory-postgres-s3-creds",
                    namespace: "artifactory",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "s3.conf": Buffer.from(config.require("S3.CONF")).toString('base64')
                },
                stringData: {}
            }
        ],
        servicemonitors: [
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "artifactory-postgres",
                    namespace: "artifactory"
                },
                spec: {
                    podMetricsEndpoints: [
                        {
                            interval: "60s",
                            scrapeTimeout: "30s",
                            scheme: "http",
                            targetPort: "exporter",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { action: "replace", replacement: "demo", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "dev", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "Container-Registry", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "artifactory", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "dc01", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["artifactory"]
                    },
                    selector: {
                        matchLabels: {
                            "postgres-operator.crunchydata.com/cluster": "artifactory",
                            "postgres-operator.crunchydata.com/instance-set": "instance"
                        }
                    }
                }
            }
        ],
        postgres: {
            namespace: "artifactory",
            name: "pgo-postgres",
            chart: "../../_chart/pgo-postgres-5.4.2.tgz",
            repository: "",
            version: "5.4.2",
            values: {
                name: "artifactory",
                postgresVersion: 13,
                monitoring: true,
                imagePostgres: "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-postgres:ubi8-13.10-0",
                imagePgBackRest: "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-pgbackrest:ubi8-2.47-0",
                imagePgBouncer: "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-pgbouncer:ubi8-1.19-4",
                imageExporter: "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-postgres-exporter:ubi8-5.4.2-0",
                instances: [
                    {
                        name: "instance",
                        replicas: 2,
                        dataVolumeClaimSpec: {
                            storageClassName: "longhorn",
                            accessModes: [
                                "ReadWriteOnce"
                            ],
                            resources: {
                                requests: {
                                    storage: "7Gi"
                                }
                            }
                        },
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" }
                        }
                    }
                ],
                patroni: {
                    dynamicConfiguration: {
                        synchronous_mode: true,
                        postgresql: {
                            parameters: {
                                synchronous_commit: "on",
                                max_parallel_workers: 1,
                                max_worker_processes: 1,
                                max_connections: "100",
                                shared_buffers: "128MB",
                                effective_cache_size: "384MB",
                                maintenance_work_mem: "32MB",
                                checkpoint_completion_target: "0.9",
                                wal_buffers: "3932kB",
                                default_statistics_target: "100",
                                random_page_cost: "4",
                                effective_io_concurrency: "2",
                                work_mem: "655kB",
                                huge_pages: "off",
                                min_wal_size: "1GB",
                                max_wal_size: "4GB"
                            }
                        }
                    }
                },
                shutdown: false,
                pgBackRestConfig: {
                    configuration: [
                        {
                            secret: {
                                name: "artifactory-postgres-s3-creds"
                            }
                        }
                    ],
                    global: {
                        "repo1-path": "/pgbackrest/artifactory/repo1",
                        "repo1-retention-full": "2",
                        "repo1-retention-full-type": "time"
                    },
                    manual: {
                        repoName: "repo1",
                        options: ["--type=full"]
                    },
                    repos: [
                        {
                            name: "repo1",
                            schedules: {
                                full: pulumi.interpolate`${minutes.result} ${hours.result} * * 0`,
                                differential: pulumi.interpolate`${minutes.result} ${hours.result} * * 1-6`,
                            },
                            s3: {
                                bucket: "backup",
                                endpoint: "http://node30.node.home.local:9000",
                                region: "us-east-1"
                            }
                        }
                    ]
                },
                pgBouncerConfig: {
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    }
                },
                monitoringConfig: {
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    }
                }
            }
        },
        artifactory: {
            namespace: "artifactory",
            name: "artifactory-oss",
            chart: "artifactory-oss",
            repository: "https://charts.jfrog.io",
            version: "107.68.14",
            values: {
                initContainerImage: "registry.cn-shanghai.aliyuncs.com/goldenimage/ubi-minimal:9.2.691",
                initContainers: {
                    resources: {
                        limits: { cpu: "100m", memory: "64Mi" },
                        requests: { cpu: "100m", memory: "64Mi" }
                    }
                },
                artifactory: {
                    fullnameOverride: "artifactory",
                    artifactory: {
                        image: {
                            registry: "registry.cn-shanghai.aliyuncs.com",
                            repository: "goldenimage/artifactory-oss",
                            tag: "7.68.14"
                        },
                        resources: {
                            limits: { cpu: "1000m", memory: "6144Mi" },
                            requests: { cpu: "1000m", memory: "6144Mi" }
                        },
                        javaOpts: {
                            xms: "4g",
                            xmx: "4g"
                        },
                        persistence: {
                            type: "s3-storage-v3",
                            awsS3V3: {
                                identity: config.require("AWS_ACCESS_KEY_ID"),
                                credential: config.require("AWS_SECRET_ACCESS_KEY"),
                                region: "us-east-1",
                                bucketName: "artifactory",
                                path: "artifactory/filestore",
                                endpoint: "node30.node.home.local:9000",
                                useHttp: true
                            }
                        }
                    },
                    nginx: { enabled: false },
                    ingress: {
                        enabled: true,
                        hosts: ["norther.example.com"],
                        routerPath: "/jfrog",
                        artifactoryPath: "/jfrog/artifactory/",
                        rtfsPath: "/jfrog/artifactory/service/rtfs/",
                        className: "nginx"
                    },
                    postgresql: { enabled: false },
                    jfconnect: { enabled: false }
                },
                postgresql: { enabled: false },
                router: {
                    image: {
                        registry: "registry.cn-shanghai.aliyuncs.com",
                        repository: "goldenimage/router",
                        tag: "7.61.1"
                    }
                },
                database: {
                    type: "postgresql",
                    driver: "org.postgresql.Driver",
                    secrets: {
                        url: {
                            name: "artifactory-pguser-artifactory",
                            key: "pgbouncer-uri"
                        }
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
    for (var secret_index in deploy_spec[i].secret) {
        const secret = new k8s.core.v1.Secret(deploy_spec[i].secret[secret_index].metadata.name, {
            metadata: deploy_spec[i].secret[secret_index].metadata,
            type: deploy_spec[i].secret[secret_index].type,
            data: deploy_spec[i].secret[secret_index].data,
            stringData: deploy_spec[i].secret[secret_index].stringData
        }, { dependsOn: [namespace] });
    }
    // Create Postgres Resource.
    const postgres = new k8s.helm.v3.Release(deploy_spec[i].postgres.name, {
        namespace: deploy_spec[i].postgres.namespace,
        name: deploy_spec[i].postgres.name,
        chart: deploy_spec[i].postgres.chart,
        version: deploy_spec[i].postgres.version,
        values: deploy_spec[i].postgres.values,
        skipAwait: true,
    }, { dependsOn: [namespace] });
    // Create service monitor.
    for (var servicemonitor_index in deploy_spec[i].servicemonitors) {
        const servicemonitor = new k8s.apiextensions.CustomResource(deploy_spec[i].servicemonitors[servicemonitor_index].metadata.name, {
            apiVersion: deploy_spec[i].servicemonitors[servicemonitor_index].apiVersion,
            kind: deploy_spec[i].servicemonitors[servicemonitor_index].kind,
            metadata: deploy_spec[i].servicemonitors[servicemonitor_index].metadata,
            spec: deploy_spec[i].servicemonitors[servicemonitor_index].spec
        }, { dependsOn: [postgres] });
    }
    // Create Release Resource.
    const artifactory = new k8s.helm.v3.Release(deploy_spec[i].artifactory.name, {
        namespace: deploy_spec[i].artifactory.namespace,
        name: deploy_spec[i].artifactory.name,
        chart: deploy_spec[i].artifactory.chart,
        version: deploy_spec[i].artifactory.version,
        values: deploy_spec[i].artifactory.values,
        skipAwait: true,
        repositoryOpts: {
            repo: deploy_spec[i].artifactory.repository,
        },
    }, { dependsOn: [postgres] });
}