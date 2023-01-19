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
                name: "kube-pod",
                chart: "vector",
                repository: "https://helm.vector.dev",
                version: "0.18.0",
                values: {
                    role: "Agent",
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
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
message = del(.message)
kubernetes_labels = encode_json(kubernetes.pod_labels)
kubernetes_labels = replace(kubernetes_labels, "app.kubernetes.io", "app_kubernetes_io")
kubernetes_labels = replace(kubernetes_labels, "helm.sh", "helm_sh")
. = parse_json!(kubernetes_labels)
.file = file
.message = message
.ip = kubernetes.pod_ip
.container = kubernetes.container_name
.node = kubernetes.pod_node_name
.pod = kubernetes.pod_name
.namespace = kubernetes.pod_namespace
.timestamp = to_timestamp(.timestamp) ?? now()`
                            }
                        },
                        sinks: {
                            kubernetes_logs_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["kubernetes_remap"],
                                bulk: { action: "index", index: "kube-pod-{{`{{ namespace }}`}}-%Y-%m-%d" },
                                endpoint: "http://opensearch-master.opensearch.svc.cluster.local:9200",
                                mode: "bulk",
                                suppress_type_name: true,
                                acknowledgements: { enabled: false },
                                compression: "none",
                                encoding: null,
                                healthcheck: null,
                                tls: { verify_certificate: false, verify_hostname: false },
                                auth: { user: "admin", password: "password", strategy: "basic" },
                                buffer: { type: "disk", max_size: 4294967296, when_full: "block" },
                                batch: { max_events: 2048, timeout_secs: 20 }
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
                    persistence: { hostPath: { path: "/var/lib/vector/kube-pod" } },
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
                name: "syslog-gelf",
                chart: "vector",
                repository: "https://helm.vector.dev",
                version: "0.18.0",
                values: {
                    role: "Aggregator",
                    replicas: 2,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
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
                        sources: {
                            syslog_socket_udp: {
                                type: "socket",
                                address: "0.0.0.0:1514",
                                max_length: 32768,
                                mode: "udp",
                                receive_buffer_bytes: 65536
                            }
                        },
                        transforms: {
                            syslog_json_udp: {
                                type: "remap",
                                inputs: ["syslog_socket_udp"],
                                source: `. = parse_json!(.message)
.timestamp = to_timestamp(.timestamp) ?? now()`
                            }
                        },
                        sinks: {
                            kubernetes_logs_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["syslog_json_udp"],
                                bulk: { action: "index", index: "syslog-%Y-%m-%d" },
                                endpoint: "http://opensearch-master.opensearch.svc.cluster.local:9200",
                                mode: "bulk",
                                suppress_type_name: true,
                                acknowledgements: { enabled: false },
                                compression: "none",
                                encoding: null,
                                healthcheck: null,
                                tls: { verify_certificate: false, verify_hostname: false },
                                auth: { user: "admin", password: "password", strategy: "basic" },
                                buffer: { type: "disk", max_size: 4294967296, when_full: "drop_newest" },
                                batch: { max_events: 2048, timeout_secs: 20 }
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
                name: "kube-audit",
                chart: "vector",
                repository: "https://helm.vector.dev",
                version: "0.18.0",
                values: {
                    role: "Agent",
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
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
                                type: "remap",
                                inputs: ["kubernetes_audit"],
                                source: `. = parse_json!(.message)`
                            }
                        },
                        sinks: {
                            kubernetes_logs_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["kubernetes_audit_json"],
                                bulk: { action: "index", index: "kube-audit-%Y-%m-%d" },
                                endpoint: "http://opensearch-master.opensearch.svc.cluster.local:9200",
                                mode: "bulk",
                                suppress_type_name: true,
                                acknowledgements: { enabled: false },
                                compression: "none",
                                encoding: null,
                                healthcheck: null,
                                tls: { verify_certificate: false, verify_hostname: false },
                                auth: { user: "admin", password: "password", strategy: "basic" },
                                buffer: { type: "disk", max_size: 4294967296, when_full: "block" },
                                batch: { max_events: 2048, timeout_secs: 20 }
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
            },
            {
                namespace: "datadog",
                name: "beats",
                chart: "vector",
                repository: "https://helm.vector.dev",
                version: "0.18.0",
                values: {
                    role: "Aggregator",
                    replicas: 2,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "300m", memory: "512Mi" },
                        requests: { cpu: "300m", memory: "512Mi" }
                    },
                    updateStrategy: {
                        type: "RollingUpdate",
                        rollingUpdate: { partition: 0 }
                    },
                    service: {
                        enabled: true,
                        type: "LoadBalancer",
                        annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
                    },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: {
                            beats_logstash_tcp: {
                                type: "logstash",
                                address: "0.0.0.0:5044",
                                acknowledgements: { enabled: false },
                                keepalive: { time_secs: 30 },
                                receive_buffer_bytes: 65536
                            }
                        },
                        sinks: {
                            kubernetes_logs_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["beats_logstash_tcp"],
                                bulk: { action: "index", index: "beats-%Y-%m-%d" },
                                endpoint: "http://opensearch-master.opensearch.svc.cluster.local:9200",
                                mode: "bulk",
                                suppress_type_name: true,
                                acknowledgements: { enabled: false },
                                compression: "none",
                                encoding: null,
                                healthcheck: null,
                                tls: { verify_certificate: false, verify_hostname: false },
                                auth: { user: "admin", password: "password", strategy: "basic" },
                                buffer: { type: "disk", max_size: 4294967296, when_full: "block" },
                                batch: { max_events: 2048, timeout_secs: 20 }
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