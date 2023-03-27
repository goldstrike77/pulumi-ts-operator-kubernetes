import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "gitlab",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "gitlab-postgres",
                    namespace: "gitlab",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "psql-password": Buffer.from(config.require("userPassword")).toString('base64'),
                },
                stringData: {}
            },
        ],
        helm: [
            {
                namespace: "gitlab",
                name: "postgresql",
                chart: "postgresql",
                repository: "https://charts.bitnami.com/bitnami",
                version: "12.2.5",
                values: {
                    global: {
                        storageClass: "longhorn",
                        postgresql: {
                            auth: {
                                postgresPassword: config.require("postgresPassword"),
                                username: "gitlab",
                                password: config.require("userPassword"),
                                database: "gitlab"
                            }
                        }
                    },
                    image: {
                        debug: false
                    },
                    architecture: "standalone",
                    primary: {
                        pgHbaConfiguration: `
local all all trust
host all all localhost trust
host gitlab gitlab 10.244.0.0/16 md5
`,
                        initdb: {
                            user: "gitlab",
                            password: config.require("userPassword"),
                        },
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "DevOps", group: "GitLab", datacenter: "dc01", domain: "local" },
                        persistence: {
                            size: "8Gi"
                        }
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
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        serviceMonitor: {
                            enabled: true,
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
                            rules: []
                        }
                    }
                }
            },
            {
                namespace: "gitlab",
                name: "redis",
                chart: "redis",
                repository: "https://charts.bitnami.com/bitnami",
                version: "17.7.1",
                values: {
                    architecture: "standalone",
                    auth: {
                        enabled: true,
                        sentinel: false,
                        password: config.require("redisPassword")
                    },
                    commonConfiguration: `appendonly no
maxmemory 256mb
tcp-keepalive 60
tcp-backlog 8192
maxclients 1000
bind 0.0.0.0
databases 4
save ""`,
                    master: {
                        resources: {
                            limits: { cpu: "200m", memory: "320Mi" },
                            requests: { cpu: "200m", memory: "320Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "DevOps", group: "GitLab", datacenter: "dc01", domain: "local" },
                        podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "8192" }] },
                        persistence: { enabled: false }
                    },
                    metrics: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "DevOps", group: "GitLab", datacenter: "dc01", domain: "local" },
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
            },
            {
                namespace: "gitlab",
                name: "gitlab",
                chart: "gitlab",
                repository: "https://charts.gitlab.io",
                version: "6.10.0",
                values: {
                    global: {
                        pod: {
                            labels: { customer: "demo", environment: "dev", project: "DevOps", group: "GitLab", datacenter: "dc01", domain: "local" },
                        },
                        edition: "ce",
                        hosts: {
                            domain: "example.com",
                            hostSuffix: "gitlab"
                        },
                        ingress: {
                            configureCertmanager: false,
                            class: "nginx",
                        },
                        minio: { enabled: false },
                        grafana: { enabled: false },
                        registry: {
                            bucket: "gitlab-registry-storage"
                        },
                        appConfig: {
                            lfs: {
                                bucket: "git-lfs",
                                connection: {
                                    secret: "objectstore-lfs",
                                    key: "connection"
                                }
                            },
                            artifacts: {
                                bucket: "gitlab-artifacts",
                                connection: {
                                    secret: "objectstore-artifacts",
                                    key: "connection"
                                }
                            },
                            uploads: {
                                bucket: "gitlab-uploads",
                                connection: {
                                    secret: "objectstore-uploads",
                                    key: "connection"
                                }
                            },
                            packages: {
                                bucket: "gitlab-packages",
                                connection: {
                                    secret: "objectstore-packages",
                                    key: "connection"
                                }
                            },
                            backups: {
                                bucket: "gitlab-backup-storage",
                                tmpBucket: "gitlab-tmp-storage"
                            },
                            gitlab: {
                                toolbox: {
                                    backups: {
                                        objectStorage: {
                                            config: {
                                                secret: "s3cmd-config",
                                                key: "config"
                                            }
                                        }
                                    }
                                }
                            },
                            registry: {
                                storage: {
                                    secret: "registry-storage",
                                    key: "config"
                                }
                            },
                            psql: {
                                password: {
                                    useSecret: true,
                                    secret: "gitlab-postgres",
                                    key: "psql-password"
                                },
                                host: "postgresql",
                                port: "5432",
                                username: "gitlab",
                                database: "gitlab"
                            },
                            redis: {
                                password: { enabled: false },
                                host: "redis-master",
                                port: "6379",
                            },
                            minio: {
                                enabled: true,
                                credentials: {}
                            }
                        },
                        upgradeCheck: { enabled: false },
                        "nginx-ingress": { enabled: false },
                        prometheus: { install: false },
                        redis: { install: false },
                        postgresql: { install: false }
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