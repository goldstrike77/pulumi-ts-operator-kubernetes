import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "datadog",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "datadog",
                name: "kubernetes-pod",
                chart: "vector",
                repository: "https://helm.vector.dev",
                version: "0.15.1",
                values: {
                    role: "Agent",
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "200m", memory: "512Mi" },
                        requests: { cpu: "200m", memory: "512Mi" }
                    },
                    service: { enabled: false },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: { kubernetes_logs: { type: "kubernetes_logs", max_line_bytes: 32768 } },
                        transforms: {
                            kubernetes_remap: {
                                type: "remap",
                                inputs: ["kubernetes_logs"],
                                source: `kubernetes = del(.kubernetes)
file = del(.file)
kubernetes_labels = encode_json(kubernetes.pod_labels)
kubernetes_labels = replace(kubernetes_labels, "app.kubernetes.io", "app_kubernetes_io")
kubernetes_labels = replace(kubernetes_labels, "helm.sh", "helm_sh")
.kubernetes = {
  "container": kubernetes.container_name,
  "node_name": kubernetes.pod_node_name,
  "pod": kubernetes.pod_name,
  "namespace": kubernetes.pod_namespace,
  "filename": file
}
.labels = parse_json!(kubernetes_labels)`,
                            },
                            kubernetes_json: {
                                type: "json_parser",
                                drop_invalid: false,
                                drop_field: true,
                                field: "kubernetes",
                                inputs: ["kubernetes_remap"],
                            },
                            kubernetes_json_labels: {
                                type: "json_parser",
                                drop_invalid: false,
                                drop_field: true,
                                field: "labels",
                                inputs: ["kubernetes_json"]
                            },
                        },
                        sinks: {
                            kubernetes_logs_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["kubernetes_json_labels"],
                                bulk: { action: "index", index: "kube-pod-%Y-%m-%d" },
                                endpoint: "https://opensearch-cluster-master.opensearch.svc.cluster.local:9200",
                                mode: "bulk",
                                suppress_type_name: true,
                                acknowledgements: null,
                                compression: "none",
                                encoding: null,
                                healthcheck: null,
                                tls: { verify_certificate: false, verify_hostname: false },
                                auth: { user: "admin", password: "password", strategy: "basic" },
                                buffer: { type: "memory", max_events: 15360, when_full: "drop_newest" },
                                batch: { max_events: 1024, timeout_secs: 2 }
                            }
                        }
                    },
                    extraVolumes: [
                        {
                            name: "varlibdockercontainers",
                            hostPath: {
                                path: "/data/containerd"
                            }
                        }
                    ],
                    extraVolumeMounts: [
                        {
                            name: "varlibdockercontainers",
                            mountPath: "/data/containerd",
                            readOnly: true
                        }
                    ],
                    podMonitor: {
                        enabled: false,
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                        ]
                    }
                }
            },
            {
                namespace: "datadog",
                name: "syslog",
                chart: "vector",
                repository: "https://helm.vector.dev",
                version: "0.15.1",
                values: {
                    role: "Aggregator",
                    replicas: 2,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                    resources: { limits: { cpu: "200m", memory: "256Mi" }, requests: { cpu: "200m", memory: "256Mi" } },
                    updateStrategy: {
                        type: "RollingUpdate",
                        rollingUpdate: { partition: 0 }
                    },
                    service: {
                        enabled: true,
                        type: "LoadBalancer",
                        annotations: {}
                    },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: { syslog_socket_udp: { type: "socket", address: "0.0.0.0:1514", max_length: 32768, mode: "udp", } },
                        transforms: {
                            syslog_json_udp: {
                                type: "json_parser",
                                drop_invalid: false,
                                drop_field: true,
                                field: "message",
                                inputs: ["syslog_socket_udp"]
                            }
                        },
                        sinks: {
                            kubernetes_logs_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["syslog_json_udp"],
                                bulk: {
                                    action: "index",
                                    index: "syslog-%Y-%m-%d"
                                },
                                endpoint: "https://opensearch-cluster-master.opensearch.svc.cluster.local:9200",
                                mode: "bulk",
                                suppress_type_name: true,
                                acknowledgements: null,
                                compression: "none",
                                encoding: null,
                                healthcheck: null,
                                tls: { verify_certificate: false, verify_hostname: false },
                                auth: { user: "admin", password: "password", strategy: "basic" },
                                buffer: { type: "disk", max_size: 4294967296, when_full: "drop_newest" },
                                batch: { max_events: 1024, timeout_secs: 2 }
                            }
                        }
                    },
                    persistence: { enabled: true, storageClassName: "longhorn", size: "5Gi" },
                    podMonitor: {
                        enabled: false,
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                        ]
                    }
                }
            },
            {
                namespace: "datadog",
                name: "kubernetes-audit",
                chart: "vector",
                repository: "https://helm.vector.dev",
                version: "0.15.1",
                values: {
                    role: "Agent",
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "200m", memory: "512Mi" },
                        requests: { cpu: "200m", memory: "512Mi" }
                    },
                    nodeSelector: { "node-role.kubernetes.io/master": "" },
                    tolerations: [{ key: "node-role.kubernetes.io/master", effect: "NoSchedule" }],
                    service: { enabled: false },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: { kubernetes_audit: { type: "file", max_line_bytes: 32768, include: ["/data/log/kube-audit/audit.log"] } },
                        transforms: {
                            kubernetes_audit_json: {
                                type: "json_parser",
                                drop_invalid: false,
                                drop_field: true,
                                field: "message",
                                inputs: ["kubernetes_audit"],
                            }
                        },
                        sinks: {
                            kubernetes_logs_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["kubernetes_audit_json"],
                                bulk: { action: "index", index: "kube-audit-%Y-%m-%d" },
                                endpoint: "https://opensearch-cluster-master.opensearch.svc.cluster.local:9200",
                                mode: "bulk",
                                suppress_type_name: true,
                                acknowledgements: null,
                                compression: "none",
                                encoding: null,
                                healthcheck: null,
                                tls: { verify_certificate: false, verify_hostname: false },
                                auth: { user: "admin", password: "password", strategy: "basic" },
                                buffer: { type: "memory", max_events: 15360, when_full: "drop_newest" },
                                batch: { max_events: 1024, timeout_secs: 2 }
                            }
                        }
                    },
                    extraVolumes: [
                        {
                            name: "varlibdockercontainers",
                            hostPath: {
                                path: "/data/log/kube-audit"
                            }
                        }
                    ],
                    extraVolumeMounts: [
                        {
                            name: "varlibdockercontainers",
                            mountPath: "/data/log/kube-audit",
                            readOnly: true
                        }
                    ],
                    podMonitor: {
                        enabled: false,
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                        ]
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