import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const podlabels = {
    customer: "sales",
    environment: "prd",
    project: "container",
    group: "ocp-sales-prd-shared-2c-01",
    datacenter: "cn-north",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "monitoring",
                annotations: {
                    "openshift.io/sa.scc.mcs": "s0:c26,c25",
                    "openshift.io/sa.scc.supplemental-groups": "1000700000/10000",
                    "openshift.io/sa.scc.uid-range": "1000700000/10000"
                },
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
        release: [
            {
                namespace: "monitoring",
                name: "kube-prometheus-stack",
                chart: "kube-prometheus-stack",
                repositoryOpts: {
                    repo: "https://prometheus-community.github.io/helm-charts"
                },
                version: "60.4.0",
                values: {
                    fullnameOverride: "kubepromstack",
                    defaultRules: { create: true },
                    alertmanager: { enabled: false },
                    grafana: { enabled: false },
                    kubeApiServer: { enabled: false },
                    kubelet: { enabled: false },
                    kubeControllerManager: { enabled: false },
                    coreDns: { enabled: false },
                    kubeEtcd: { enabled: false },
                    kubeScheduler: { enabled: false },
                    kubeProxy: { enabled: false },
                    kubeStateMetrics: { enabled: false },
                    /**
                    "kube-state-metrics": {
                        fullnameOverride: "kube-state-metrics",
                        image: {
                            registry: "swr.cn-east-3.myhuaweicloud.com",
                            repository: "gcr-io/kube-state-metrics",
                            tag: "v2.12.0"
                        },
                        customLabels: podlabels,
                        metricLabelsAllowlist: ["nodes=[*]"],
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        prometheus: {
                            monitor: {
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
                            }
                        },
                        securityContext: {
                            runAsGroup: 1000700000,
                            runAsUser: 1000700000,
                            fsGroup: 1000700000
                        },
                        rbac: {
                            useClusterRole: false,
                            useExistingRole: false
                        },
                        releaseNamespace: true,
                        collectors: [
                            "configmaps",
                            "cronjobs",
                            "daemonsets",
                            "deployments",
                            "endpoints",
                            "horizontalpodautoscalers",
                            "ingresses",
                            "jobs",
                            "leases",
                            "limitranges",
                            "networkpolicies",
                            "persistentvolumeclaims",
                            "poddisruptionbudgets",
                            "pods",
                            "replicasets",
                            "replicationcontrollers",
                            "resourcequotas",
                            "secrets",
                            "services",
                            "statefulsets"
                        ]
                    },
                     */
                    nodeExporter: { enabled: false },
                    prometheusOperator: {
                        enabled: true,
                        admissionWebhooks: {
                            enabled: true,
                            image: {
                                registry: "swr.cn-east-3.myhuaweicloud.com",
                                repository: "quay-io/admission-webhook",
                                tag: "v0.74.0"
                            },
                            patch: {
                                enabled: true,
                                image: {
                                    registry: "swr.cn-east-3.myhuaweicloud.com",
                                    repository: "gcr-io/kube-webhook-certgen",
                                    tag: "v20221220-controller-v1.5.1-58-g787ea74b6"
                                }
                            }
                        },
                        denyNamespaces: ["openshift-monitoring"],
                        podLabels: podlabels,
                        logLevel: "warn",
                        serviceMonitor: {
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
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        image: {
                            registry: "swr.cn-east-3.myhuaweicloud.com",
                            repository: "quay-io/prometheus-operator",
                            tag: "v0.74.0"
                        },
                        securityContext: {
                            runAsGroup: 1000700000,
                            runAsUser: 1000700000,
                            fsGroup: 1000700000
                        },
                        prometheusConfigReloader: {
                            image: {
                                registry: "swr.cn-east-3.myhuaweicloud.com",
                                repository: "quay-io/prometheus-config-reloader",
                                tag: "v0.74.0"
                            },
                            resources: {
                                limits: { cpu: "200m", memory: "64Mi" },
                                requests: { cpu: "200m", memory: "64Mi" }
                            }
                        },
                        thanosImage: {
                            registry: "swr.cn-east-3.myhuaweicloud.com",
                            repository: "quay-io/thanos",
                            tag: "v0.35.1"
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
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "sales" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "ocp-sales-prd-shared-2c-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        },
                        service: {
                            annotations: { "metallb.universe.tf/allow-shared-ip": "monitoring" },
                            loadBalancerIP: "192.168.0.110",
                            type: "LoadBalancer"
                        },
                        ingress: { enabled: false },
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "sales" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "ocp-sales-prd-shared-2c-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        },
                        prometheusSpec: {
                            disableCompaction: true,
                            scrapeInterval: "60s",
                            scrapeTimeout: "30s",
                            evaluationInterval: "60s",
                            image: {
                                registry: "swr.cn-east-3.myhuaweicloud.com",
                                repository: "quay-io/prometheus",
                                tag: "v2.53.0"
                            },
                            volumeMounts: [
                                {
                                    mountPath: "/etc/prometheus/secrets/prometheus-k8s-tls",
                                    name: "secret-prometheus-k8s-tls",
                                    readOnly: true
                                },
                                {
                                    mountPath: "/etc/prometheus/secrets/prometheus-k8s-proxy",
                                    name: "secret-prometheus-k8s-proxy",
                                    readOnly: true
                                },
                                {
                                    mountPath: "/etc/prometheus/secrets/prometheus-k8s-thanos-sidecar-tls",
                                    name: "secret-prometheus-k8s-thanos-sidecar-tls",
                                    readOnly: true
                                },
                                {
                                    mountPath: "/etc/prometheus/secrets/kube-rbac-proxy",
                                    name: "secret-kube-rbac-proxy",
                                    readOnly: true
                                },
                                {
                                    mountPath: "/etc/prometheus/secrets/metrics-client-certs",
                                    name: "secret-metrics-client-certs",
                                    readOnly: true
                                },
                                {
                                    mountPath: "/etc/prometheus/configmaps/serving-certs-ca-bundle",
                                    name: "configmap-serving-certs-ca-bundle",
                                    readOnly: true
                                },
                                {
                                    mountPath: "/etc/prometheus/configmaps/kubelet-serving-ca-bundle",
                                    name: "configmap-kubelet-serving-ca-bundle",
                                    readOnly: true
                                },
                                {
                                    mountPath: "/etc/prometheus/configmaps/metrics-client-ca",
                                    name: "configmap-metrics-client-ca",
                                    readOnly: true
                                }
                            ],
                            volumes: [
                                {
                                    name: "secret-prometheus-k8s-tls",
                                    secret: {
                                        defaultMode: 420,
                                        secretName: "prometheus-k8s-tls"
                                    }
                                },
                                {
                                    name: "secret-prometheus-k8s-proxy",
                                    secret: {
                                        defaultMode: 420,
                                        secretName: "prometheus-k8s-proxy"
                                    }
                                },
                                {
                                    name: "secret-prometheus-k8s-thanos-sidecar-tls",
                                    secret: {
                                        defaultMode: 420,
                                        secretName: "prometheus-k8s-thanos-sidecar-tls"
                                    }
                                },
                                {
                                    name: "secret-kube-rbac-proxy",
                                    secret: {
                                        defaultMode: 420,
                                        secretName: "kube-rbac-proxy"
                                    }
                                },
                                {
                                    name: "secret-metrics-client-certs",
                                    secret: {
                                        defaultMode: 420,
                                        secretName: "metrics-client-certs"
                                    }
                                },
                                {
                                    configMap: {
                                        defaultMode: 420,
                                        name: "serving-certs-ca-bundle"
                                    },
                                    name: "configmap-serving-certs-ca-bundle"
                                },
                                {
                                    configMap: {
                                        defaultMode: 420,
                                        name: "kubelet-serving-ca-bundle"
                                    },
                                    name: "configmap-kubelet-serving-ca-bundle"
                                },
                                {
                                    configMap: {
                                        defaultMode: 420,
                                        name: "metrics-client-ca"
                                    },
                                    name: "configmap-metrics-client-ca"
                                }
                            ],
                            externalLabels: { cluster: "ocp-sales-prd-shared-2c-01" },
                            ruleSelectorNilUsesHelmValues: false,
                            serviceMonitorSelectorNilUsesHelmValues: false,
                            podMonitorSelectorNilUsesHelmValues: false,
                            probeSelectorNilUsesHelmValues: false,
                            retention: "2h",
                            retentionSize: "4096MB",
                            replicas: 2,
                            logLevel: "warn",
                            resources: {
                                limits: { cpu: "1000m", memory: "3072Mi" },
                                requests: { cpu: "1000m", memory: "3072Mi" }
                            },
                            storageSpec: {
                                volumeClaimTemplate: {
                                    spec: {
                                        storageClassName: "vsphere-san-sc",
                                        resources: {
                                            requests: {
                                                storage: "7Gi"
                                            }
                                        }
                                    }
                                }
                            },
                            additionalAlertRelabelConfigs: [
                                {
                                    regex: "prometheus|cluster",
                                    action: "labeldrop"
                                }
                            ],
                            thanos: {
                                resources: {
                                    limits: { cpu: "200m", memory: "256Mi" },
                                    requests: { cpu: "200m", memory: "256Mi" }
                                },
                                objectStorageConfig: {
                                    existingSecret: {
                                        name: "configuration-secret",
                                        key: "objstore.yml"
                                    }
                                }
                            },
                            securityContext: {
                                runAsGroup: 1000700000,
                                runAsUser: 1000700000,
                                fsGroup: 1000700000
                            }
                        }
                    }
                }
            },
            {
                namespace: "monitoring",
                name: "thanos",
                chart: "thanos",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "15.7.10",
                values: {
                    image:
                    {
                        registry: "swr.cn-east-3.myhuaweicloud.com",
                        repository: "docker-io/thanos",
                        tag: "0.35.1-debian-12-r1"
                    },
                    existingObjstoreSecret: "configuration-secret",
                    query: { enabled: false },
                    queryFrontend: { enabled: false },
                    bucketweb: { enabled: false },
                    compactor: {
                        enabled: true,
                        logLevel: "warn",
                        // 5m resolution retention must be higher than the minimum block size after which 1h resolution downsampling will occur (10 days).
                        retentionResolutionRaw: "10d",
                        retentionResolution5m: "30d",
                        retentionResolution1h: "30d",
                        extraFlags: [
                            "--compact.cleanup-interval=6h",
                            "--compact.concurrency=2"
                        ],
                        resources: {
                            limits: { cpu: "500m", memory: "2048Mi" },
                            requests: { cpu: "500m", memory: "2048Mi" }
                        },
                        podLabels: podlabels,
                        persistence: {
                            enabled: true,
                            storageClass: "vsphere-san-sc",
                            size: "7Gi"
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
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
  cache_size: 128MiB
  expiration: 24h0m0s
`, `--store.caching-bucket.config=
type: REDIS
config:
  addr: "redis-master:6379"
  db: 0
  dial_timeout: 10s
  read_timeout: 10s
  write_timeout: 10s
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
  cache_size: 64MiB
  expiration: 24h0m0s
`
                        ],
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        },
                        podLabels: podlabels,
                        persistence: {
                            enabled: true,
                            storageClass: "vsphere-san-sc",
                            size: "7Gi"
                        }
                    },
                    metrics: {
                        enabled: true,
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
                            groups: []
                        }
                    },
                    volumePermissions: { enabled: false }
                }
            },
            {
                namespace: "monitoring",
                name: "redis",
                chart: "redis",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "19.6.0",
                values: {
                    architecture: "standalone",
                    image: {
                        registry: "swr.cn-east-3.myhuaweicloud.com",
                        repository: "docker-io/redis",
                        tag: "7.2.5-debian-12-r0"
                    },
                    auth: { enabled: false, sentinel: false },
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
                        podLabels: podlabels,
                        persistence: { enabled: false }
                    },
                    metrics: {
                        enabled: true,
                        image: {
                            registry: "swr.cn-east-3.myhuaweicloud.com",
                            repository: "docker-io/redis-exporter",
                            tag: "1.61.0-debian-12-r0"
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        podLabels: podlabels,
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
                    sysctl: { enabled: false }
                }
            }
        ],
        customresource: [
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "ServiceMonitor",
                metadata: {
                    name: "node-exporter",
                    namespace: "monitoring"
                },
                spec: {
                    endpoints: [
                        {
                            interval: "60s",
                            scheme: "https",
                            tlsConfig: {
                                caFile: "/etc/prometheus/configmaps/serving-certs-ca-bundle/service-ca.crt",
                                certFile: "/etc/prometheus/secrets/metrics-client-certs/tls.crt",
                                keyFile: "/etc/prometheus/secrets/metrics-client-certs/tls.key",
                                serverName: "node-exporter.openshift-monitoring.svc"
                            },
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_node_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "sales" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "ocp-sales-prd-shared-2c-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["openshift-monitoring"]
                    },
                    selector: {
                        matchLabels: {
                            "app.kubernetes.io/component": "exporter",
                            "app.kubernetes.io/name": "node-exporter",
                            "app.kubernetes.io/part-of": "openshift-monitoring"
                        }
                    }
                }
            }
        ],
        /**
        configfile: [
            { file: "../_rules/priority/kube-prometheus-stack-alertmanager" },
            { file: "../_rules/priority/kube-prometheus-stack-config-reloaders" },
            { file: "../_rules/priority/kube-prometheus-stack-etcd" },
            { file: "../_rules/priority/kube-prometheus-stack-general" },
            { file: "../_rules/priority/kube-prometheus-stack-k8s" },
            { file: "../_rules/priority/kube-prometheus-stack-kube-apiserver-availability" },
            { file: "../_rules/priority/kube-prometheus-stack-kube-apiserver-burnrate" },
            { file: "../_rules/priority/kube-prometheus-stack-kube-apiserver-histogram" },
            { file: "../_rules/priority/kube-prometheus-stack-kube-apiserver-slos" },
            { file: "../_rules/priority/kube-prometheus-stack-kube-prometheus-general" },
            { file: "../_rules/priority/kube-prometheus-stack-kube-prometheus-node-recording" },
            { file: "../_rules/priority/kube-prometheus-stack-kube-scheduler" },
            { file: "../_rules/priority/kube-prometheus-stack-kube-state-metrics" },
            { file: "../_rules/priority/kube-prometheus-stack-kubelet" },
            { file: "../_rules/priority/kube-prometheus-stack-kubernetes-apps" },
            { file: "../_rules/priority/kube-prometheus-stack-kubernetes-resources" },
            { file: "../_rules/priority/kube-prometheus-stack-kubernetes-storage" },
            { file: "../_rules/priority/kube-prometheus-stack-kubernetes-system" },
            { file: "../_rules/priority/kube-prometheus-stack-kubernetes-system-apiserver" },
            { file: "../_rules/priority/kube-prometheus-stack-kubernetes-system-controller-manager" },
            { file: "../_rules/priority/kube-prometheus-stack-kubernetes-system-kube-proxy" },
            { file: "../_rules/priority/kube-prometheus-stack-kubernetes-system-kubelet" },
            { file: "../_rules/priority/kube-prometheus-stack-kubernetes-system-scheduler" },
            { file: "../_rules/priority/kube-prometheus-stack-node-exporter" },
            { file: "../_rules/priority/kube-prometheus-stack-node" },
            { file: "../_rules/priority/kube-prometheus-stack-prometheus" },
            { file: "../_rules/priority/kube-prometheus-stack-prometheus-operator" },
            { file: "../_rules/priority/blackbox" },
            { file: "../_rules/priority/jenkins" }
        ]
         */
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [secret] });
const configfile = new k8s_module.yaml.ConfigFile('ConfigFile', { resources: resources }, { dependsOn: [release] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [namespace] });