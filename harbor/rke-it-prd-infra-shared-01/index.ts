import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

const podlabels = {
    customer: "it",
    environment: "prd",
    project: "Container-Registry",
    group: "Harbor",
    datacenter: "cn-north",
    domain: "local"
}

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

const resources = [
    {
        namespace: {
            metadata: {
                name: "harbor",
                annotations: {},
                labels: {
                    "pod-security.kubernetes.io/enforce": "privileged",
                    "pod-security.kubernetes.io/audit": "privileged",
                    "pod-security.kubernetes.io/warn": "privileged"
                }
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "harbor-postgres-s3-creds",
                    namespace: "harbor",
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
        customresource: [
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "harbor-postgres",
                    namespace: "harbor"
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
                                { action: "replace", replacement: "it", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "prd", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "Container-Registry", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "Harbor", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "cn-north", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["harbor"]
                    },
                    selector: {
                        matchLabels: {
                            "postgres-operator.crunchydata.com/cluster": "harbor",
                            "postgres-operator.crunchydata.com/instance-set": "instance"
                        }
                    }
                }
            },
            {
                apiVersion: "redis.redis.opstreelabs.in/v1beta2",
                kind: "Redis",
                metadata: {
                  name: "harbor-redis-standalone",
                  namespace: "harbor"
                },
                spec: {
                  kubernetesConfig: {
                    image: "quay.io/opstree/redis:v7.0.12",
                    imagePullPolicy: "IfNotPresent"
                  },
                  redisExporter: {
                    enabled: true,
                    image: "quay.io/opstree/redis-exporter:v1.44.0",
                    imagePullPolicy: "Always"
                  },
                  podSecurityContext: {
                    runAsUser: 1000,
                    fsGroup: 1000
                  }
                }
              }
        ],
        release: [
            {
                namespace: "harbor",
                name: "pgo-postgres",
                chart: "../../_chart/pgo-postgres-5.6.0.tgz",
                version: "5.6.0",
                values: {
                    name: "harbor",
                    postgresVersion: 14,
                    monitoring: true,
                    instances: [
                        {
                            name: "postgres-instance",
                            replicas: 1,
                            dataVolumeClaimSpec: {
                                storageClassName: "vsphere-san-sc",
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
                                    name: "harbor-postgres-s3-creds"
                                }
                            }
                        ],
                        global: {
                            "repo1-path": "/pgbackrest/harbor/repo1",
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
                                    endpoint: "http://storage.home.local:9000",
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
            {
                namespace: "harbor",
                name: "harbor",
                chart: "harbor",
                repositoryOpts: {
                    repo: "https://helm.goharbor.io"
                },
                version: "1.15.0",
                values: {
                    expose: {
                        type: "clusterIP",
                        tls: { enabled: false }
                    },
                    externalURL: "https://harbor.home.local",
                    persistence: {
                        enabled: true,
                        persistentVolumeClaim: {
                            registry: { storageClass: "vsphere-san-sc", size: "5Gi" },
                            jobservice: { jobLog: { storageClass: "vsphere-san-sc", size: "1Gi" } },
                            trivy: { storageClass: "vsphere-san-sc", size: "5Gi" }
                        },
                        imageChartStorage: {
                            type: "s3",
                            s3: {
                                region: "us-east-1",
                                bucket: "harbor",
                                accesskey: config.require("AWS_ACCESS_KEY_ID"),
                                secretkey: config.require("AWS_SECRET_ACCESS_KEY"),
                                regionendpoint: "http://obs.home.local:9000",
                                encrypt: false,
                                secure: false,
                                skipverify: true
                            }
                        }
                    },
                    harborAdminPassword: config.require("HARBOR_ADMIN_PASSWORD"),
                    logLevel: "warning",
                    secretKey: "not-a-secure-key",
                    metrics: {
                        enabled: true,
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
                            relabelings: []
                        }
                    },
                    cache: {
                        enabled: false,
                        expireHours: 24
                    },
                    nginx: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/nginx-photon",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "256Mi" },
                            requests: { cpu: "100m", memory: "256Mi" }
                        },
                        podLabels: podlabels
                    },
                    portal: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-portal",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "256Mi" },
                            requests: { cpu: "100m", memory: "256Mi" }
                        },
                        podLabels: podlabels
                    },
                    core: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-core",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "256Mi" },
                            requests: { cpu: "100m", memory: "256Mi" }
                        },
                        podLabels: podlabels
                    },
                    jobservice: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-jobservice",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "256Mi" },
                            requests: { cpu: "100m", memory: "256Mi" }
                        },
                        podLabels: podlabels
                    },
                    registry: {
                        registry: {
                            image: {
                                repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/registry-photon",
                                tag: "v2.11.0"
                            },
                            resources: {
                                limits: { cpu: "100m", memory: "256Mi" },
                                requests: { cpu: "100m", memory: "256Mi" }
                            },
                        },
                        controller: {
                            image: {
                                repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-registryctl",
                                tag: "v2.11.0"
                            },
                            resources: {
                                limits: { cpu: "100m", memory: "256Mi" },
                                requests: { cpu: "100m", memory: "256Mi" }
                            },
                        },
                        replicas: 1,
                        podLabels: podlabels
                    },
                    trivy: {
                        enabled: true,
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/trivy-adapter-photon",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "1000m", memory: "1024Mi" },
                            requests: { cpu: "1000m", memory: "1024Mi" }
                        },
                        podLabels: podlabels
                    },
                    database: {
                        type: "external",
                        external: {
                            host: "harbor-pgbouncer.harbor.svc",
                            port: "5432",
                            username: "harbor",
                            coreDatabase: "harbor",
                            existingSecret: "harbor-pguser-harbor",
                            sslmode: "require"
                        }
                    },
                    redis: {
                        type: "external",
                        external: {
                            addr: "harbor-redis-standalone:6379"
                        }
                    },
                    exporter: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-exporter",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "256Mi" },
                            requests: { cpu: "100m", memory: "256Mi" }
                        },
                        podLabels: podlabels
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [secret] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [namespace] });