import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();


const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "monitoring",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "configuration-secret",
                    namespace: "monitoring",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "objstore.yml": config.require("OBJSTORE.YML")
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "monitoring",
                name: "redis",
                chart: "redis",
                repository: "https://charts.bitnami.com/bitnami",
                version: "17.3.11",
                values: {
                    architecture: "standalone",
                    auth: { enabled: false, sentinel: false },
                    commonConfiguration: `appendonly no
maxmemory 512mb
tcp-keepalive 60
tcp-backlog 8192
maxclients 1000
bind 0.0.0.0
databases 4
save ""`,
                    master: {
                        resources: {
                            limits: { cpu: "300m", memory: "576Mi" },
                            requests: { cpu: "300m", memory: "576Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                        podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "8192" }] },
                        persistence: { enabled: false }
                    },
                    metrics: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                        serviceMonitor: {
                            enabled: false,
                            relabellings: [
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
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        }
                    }
                }
            },
            {
                namespace: "monitoring",
                name: "thanos",
                chart: "thanos",
                repository: "https://charts.bitnami.com/bitnami",
                version: "11.6.3",
                values: {
                    existingObjstoreSecret: "configuration-secret",
                    query: { enabled: false },
                    queryFrontend: { enabled: false },
                    bucketweb: {
                        enabled: true,
                        logLevel: "warn",
                        extraFlags: ["--web.external-prefix=thanos-bucketweb", "--web.route-prefix=thanos-bucketweb"],
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                        ingress: {
                            enabled: true,
                            hostname: "souther.example.com",
                            ingressClassName: "nginx",
                            annotations: { "nginx.ingress.kubernetes.io/backend-protocol": "HTTP" },
                            path: "/thanos-bucketweb"
                        }
                    },
                    compactor: {
                        enabled: true,
                        logLevel: "warn",
                        retentionResolutionRaw: "10d",
                        retentionResolution5m: "10d",
                        retentionResolution1h: "10d",
                        extraFlags: [
                            "--compact.cleanup-interval=6h",
                            "--compact.concurrency=2"
                        ],
                        resources: {
                            limits: { cpu: "500m", memory: "2048Mi" },
                            requests: { cpu: "500m", memory: "2048Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                        persistence: {
                            enabled: true,
                            storageClass: "nfs-client",
                            size: "8Gi"
                        }
                    },
                    storegateway: {
                        enabled: true,
                        logLevel: "warn",
                        extraFlags: [
                            "--store.grpc.series-max-concurrency=32",
                            "--block-sync-concurrency=32",
                            "--store.grpc.series-sample-limit=50000", `--index-cache.config=
type: REDIS
config:
  addr: "redis-master:6379"
  db: 1
  dial_timeout: 10s
  read_timeout: 10s
  write_timeout: 10s
  pool_size: 200
  min_idle_conns: 20
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
`, `--store.caching-bucket.config=
type: REDIS
config:
  addr: "redis-master:6379"
  db: 0
  dial_timeout: 10s
  read_timeout: 10s
  write_timeout: 10s
  pool_size: 200
  min_idle_conns: 20
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
`
                        ],
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "2048Mi" },
                            requests: { cpu: "500m", memory: "2048Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                        service: {
                            type: "LoadBalancer",
                            ports: { grpc: 10903 },
                            annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
                        },
                        persistence: {
                            enabled: true,
                            storageClass: "nfs-client",
                            size: "8Gi"
                        }
                    },
                    metrics: {
                        enabled: true,
                        serviceMonitor: {
                            enabled: true,
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        },
                        prometheusRule: {
                            enabled: true,
                            groups: []
                        }
                    },
                    volumePermissions: { enabled: false }
                }
            },
            {
                namespace: "monitoring",
                name: "kube-prometheus-stack",
                chart: "kube-prometheus-stack",
                repository: "https://prometheus-community.github.io/helm-charts",
                version: "42.0.3",
                values: {
                    defaultRules: { create: true },
                    alertmanager: { enabled: false },
                    grafana: { enabled: false },
                    kubeApiServer: {
                        enabled: true,
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "souther" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    },
                    kubelet: {
                        enabled: true,
                        serviceMonitor: {
                            probes: false,
                            cAdvisorRelabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "souther" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ],
                            relabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "souther" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    },
                    kubeControllerManager: {
                        enabled: true,
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "souther" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    },
                    coreDns: {
                        enabled: true,
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "souther" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    },
                    kubeEtcd: {
                        enabled: true,
                        service: {
                            port: "2381",
                            targetPort: "2381"
                        },
                        serviceMonitor: {
                            scheme: "http",
                            relabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "souther" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    },
                    kubeScheduler: {
                        enabled: true,
                        service: {
                            port: "10259",
                            targetPort: "10259"
                        },
                        serviceMonitor: {
                            https: true,
                            insecureSkipVerify: true,
                            relabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "souther" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    },
                    kubeProxy: {
                        enabled: true,
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "souther" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }

                    },
                    kubeStateMetrics: { enabled: true },
                    "kube-state-metrics": {
                        image: {
                            repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/kube-state-metrics",
                            tag: "v2.6.0"
                        },
                        replicas: 1,
                        customLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                        metricLabelsAllowlist: ["nodes=[*]"],
                        resources: {
                            limits: { cpu: "100m", memory: "256Mi" },
                            requests: { cpu: "100m", memory: "256Mi" }
                        },
                        prometheus: {
                            monitor: {
                                enabled: true,
                                relabelings: [
                                    { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                    { sourceLabels: ["___meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                                ]
                            }
                        }
                    },
                    nodeExporter: { enabled: true },
                    "prometheus-node-exporter": {
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        podLabels: { jobLabel: "node-exporter", customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                        extraArgs: [
                            "--collector.filesystem.mount-points-exclude=^/(dev|proc|sys|var/lib/docker/.+|var/lib/kubelet/.+)($|/)",
                            "--collector.filesystem.fs-types-exclude=^(autofs|binfmt_misc|bpf|cgroup2?|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|iso9660|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tracefs)$",
                            "--collector.cpu.info"
                        ],
                        prometheus: {
                            monitor: {
                                enabled: true,
                                relabelings: [
                                    { sourceLabels: ["__meta_kubernetes_pod_node_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                                ],
                            }
                        }
                    },
                    prometheusOperator: {
                        enabled: true,
                        admissionWebhooks: {
                            enabled: true,
                            patch: {
                                enabled: true,
                                image: {
                                    registry: "registry.cn-hangzhou.aliyuncs.com",
                                    repository: "google_containers/kube-webhook-certgen",
                                    tag: "v1.3.0",
                                    sha: "7bbcbd4232c692a36f8796e9602c14f2ec3b6c638d2974ea81b736ee2bd6e279"
                                }
                            }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                        logLevel: "warn",
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        },
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        prometheusConfigReloader: {
                            resources: {
                                limits: { cpu: "200m", memory: "64Mi" },
                                requests: { cpu: "200m", memory: "64Mi" }
                            }
                        }
                    },
                    prometheus: {
                        enabled: true,
                        thanosService: {
                            enabled: true,
                        },
                        thanosServiceMonitor: {
                            enabled: true,
                            relabelings: [
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "souther" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        },
                        thanosServiceExternal: {
                            enabled: true,
                            annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
                        },
                        ingress: {
                            enabled: true,
                            ingressClassName: "nginx",
                            annotations: { "nginx.ingress.kubernetes.io/backend-protocol": "HTTP" },
                            hosts: ["souther.example.com"],
                            paths: ["/prometheus"],
                        },
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "souther" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        },
                        prometheusSpec: {
                            disableCompaction: true,
                            scrapeInterval: "60s",
                            scrapeTimeout: "30s",
                            evaluationInterval: "60s",
                            externalLabels: { cluster: "souther" },
                            externalUrl: "https://souther.example.com/prometheus/",
                            serviceMonitorSelectorNilUsesHelmValues: false,
                            podMonitorSelectorNilUsesHelmValues: false,
                            retention: "1d",
                            retentionSize: "4096MB",
                            replicas: 1,
                            logLevel: "warn",
                            routePrefix: "/prometheus",
                            resources: {
                                limits: { cpu: "1000m", memory: "2048Mi" },
                                requests: { cpu: "1000m", memory: "2048Mi" }
                            },
                            storageSpec: {
                                volumeClaimTemplate: {
                                    spec: {
                                        storageClassName: "nfs-client",
                                        resources: { requests: { storage: "8Gi" } }
                                    }
                                }
                            },
                            additionalAlertManagerConfigs: [
                                {
                                    static_configs: [{ targets: ["norther.example.com"] }],
                                    tls_config: { insecure_skip_verify: true },
                                    timeout: "20s",
                                    path_prefix: "/alertmanager",
                                    scheme: "https"
                                }
                            ],
                            thanos: {
                                objectStorageConfig: {
                                    name: "configuration-secret",
                                    key: "objstore.yml"
                                }
                            }
                        }
                    }
                }
            }
        ],
        /**
                yaml: [
                    { name: "../_rules/severity/alertmanager-prometheusRule.yaml" },
                    { name: "../_rules/severity/kubePrometheus-prometheusRule.yaml" },
                    { name: "../_rules/severity/kubeStateMetrics-prometheusRule.yaml" },
                    { name: "../_rules/severity/kubernetesControlPlane-prometheusRule.yaml" },
                    { name: "../_rules/severity/nodeExporter-prometheusRule.yaml" },
                    { name: "../_rules/severity/prometheus-prometheusRule.yaml" },
                    { name: "../_rules/severity/prometheusOperator-prometheusRule.yaml" }
                ]
         */
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
    // Create Prometheus rules.
    /**
    for (var yaml_index in deploy_spec[i].yaml) {
        const guestbook = new k8s.yaml.ConfigFile(deploy_spec[i].yaml[yaml_index].name, {
            file: deploy_spec[i].yaml[yaml_index].name,
            skipAwait: true,
        }, { dependsOn: [namespace] });
    }
     */
}