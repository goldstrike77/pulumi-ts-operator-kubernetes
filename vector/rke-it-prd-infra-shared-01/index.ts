import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const podlabels = {
    customer: "it",
    environment: "prd",
    project: "SEIM",
    group: "Vector",
    datacenter: "cn-north",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "datadog",
                annotations: {},
                labels: {
                    "pod-security.kubernetes.io/enforce": "privileged",
                    "pod-security.kubernetes.io/audit": "privileged",
                    "pod-security.kubernetes.io/warn": "privileged"
                }
            },
            spec: {}
        },
        release: [
            {
                namespace: "datadog",
                name: "kube-pod",
                chart: "vector",
                repositoryOpts: {
                    repo: "https://helm.vector.dev"
                },
                version: "0.33.0",
                values: {
                    role: "Agent",
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/vector",
                        tag: "0.38.0-distroless-libc"
                    },
                    podLabels: podlabels,
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    tolerations: [{ key: "CriticalAddonsOnly", operator: "Exists" }],
                    service: { enabled: false },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: {
                            kubernetes_logs: {
                                type: "kubernetes_logs",
                                max_line_bytes: 65536
                            }
                        },
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
.message = message
.ip = kubernetes.pod_ip
.container = kubernetes.container_name
.node = kubernetes.pod_node_name
.pod = kubernetes.pod_name
.namespace = kubernetes.pod_namespace
.timestamp = timestamp(.timestamp) ?? now()
.cluster = "rke-it-prd-infra-shared-01"`
                            },
                            kubernetes_filter: {
                                type: "filter",
                                inputs: ["kubernetes_remap"],
                                condition: '.app != "longhorn-manager" && .container != "metallb-speaker"'
                            }
                        },
                        sinks: {
                            kubernetes_logs_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["kubernetes_filter"],
                                bulk: { action: "index", index: "kube-pod-{{`{{ namespace }}`}}-%Y-%m-%d" },
                                endpoint: "https://opensearch-master.opensearch:9200",
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
                    /**
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
                     */
                    persistence: { hostPath: { path: "/var/lib/vector/kube-pod" } },
                    podMonitor: {
                        enabled: true,
                    }
                }
            },
            {
                namespace: "datadog",
                name: "apisix-udp",
                chart: "vector",
                repositoryOpts: {
                    repo: "https://helm.vector.dev"
                },
                version: "0.33.0",
                values: {
                    role: "Aggregator",
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/vector",
                        tag: "0.38.0-distroless-libc"
                    },
                    replicas: 1,
                    podLabels: podlabels,
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    updateStrategy: {
                        type: "RollingUpdate",
                        rollingUpdate: { partition: 0 }
                    },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        enrichment_tables: {
                            geoip_table: {
                                path: "/GeoLite2-City.mmdb",
                                type: "geoip"
                            }
                        },
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: {
                            syslog_socket_udp: {
                                type: "socket",
                                address: "0.0.0.0:1514",
                                max_length: 65536,
                                mode: "udp",
                                receive_buffer_bytes: 65536
                            }
                        },
                        transforms: {
                            syslog_json_udp: {
                                type: "remap",
                                inputs: ["syslog_socket_udp"],
                                source: `. = parse_json!(.message)`
                            },
                            syslog_json_udp_geoip: {
                                type: "remap",
                                inputs: ["syslog_json_udp"],
                                source: `""
        if exists(."remote_addr") {
          .geoip = get_enrichment_table_record!("geoip_table", { "ip": .remote_addr })
        }
        ""`
                            },
                            syslog_json_udp_filter: {
                                type: "filter",
                                inputs: ["syslog_json_udp_geoip"],
                                condition: '!(ip_cidr_contains!("10.42.0.0/16", .remote_addr))'
                            }
                        },
                        sinks: {
                            syslog_json_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["syslog_json_udp_filter"],
                                bulk: { action: "index", index: "apisix-%Y-%m-%d" },
                                endpoint: "https://opensearch-master.opensearch:9200",
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
                    persistence: { enabled: true, storageClassName: "vsphere-san-sc", size: "7Gi" },
                    podMonitor: {
                        enabled: true,
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_region"], targetLabel: "region" }
                        ]
                    }
                }
            },
            {
                namespace: "datadog",
                name: "syslog",
                chart: "vector",
                repositoryOpts: {
                    repo: "https://helm.vector.dev"
                },
                version: "0.33.0",
                values: {
                    role: "Aggregator",
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/vector",
                        tag: "0.38.0-distroless-libc"
                    },
                    replicas: 1,
                    podLabels: podlabels,
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
                        annotations: { "metallb.universe.tf/allow-shared-ip": "shared" },
                        loadBalancerIP: "192.168.0.103"
                    },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: {
                            syslog_socket_udp: {
                                type: "socket",
                                address: "0.0.0.0:1514",
                                max_length: 65536,
                                mode: "udp",
                                receive_buffer_bytes: 65536
                            }
                        },
                        transforms: {
                            syslog_json_udp: {
                                type: "remap",
                                inputs: ["syslog_socket_udp"],
                                source: `. = parse_json!(.message)
.timestamp = timestamp(.timestamp) ?? now()`
                            }
                        },
                        sinks: {
                            syslog_json_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["syslog_json_udp"],
                                bulk: { action: "index", index: "syslog-%Y-%m-%d" },
                                endpoint: "https://opensearch-master.opensearch:9200",
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
                    persistence: { enabled: true, storageClassName: "vsphere-san-sc", size: "7Gi" },
                    podMonitor: {
                        enabled: true,
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
                name: "auditbeat",
                chart: "vector",
                repositoryOpts: {
                    repo: "https://helm.vector.dev"
                },
                version: "0.33.0",
                values: {
                    role: "Aggregator",
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/vector",
                        tag: "0.38.0-distroless-libc"
                    },
                    replicas: 1,
                    podLabels: podlabels,
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
                        annotations: { "metallb.universe.tf/allow-shared-ip": "shared" },
                        loadBalancerIP: "192.168.0.105"
                    },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: {
                            beats_logstash_tcp: {
                                type: "logstash",
                                address: "0.0.0.0:5044",
                                connection_limit: 200,
                                keepalive: { time_secs: 30 },
                                receive_buffer_bytes: 65536
                            }
                        },
                        sinks: {
                            beats_json_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["beats_logstash_tcp"],
                                bulk: { action: "index", index: "auditbeat-%Y-%m-%d" },
                                endpoint: "https://opensearch-master.opensearch:9200",
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
                    persistence: { enabled: true, storageClassName: "vsphere-san-sc", size: "7Gi" },
                    podMonitor: {
                        enabled: true,
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
                name: "packetbeat",
                chart: "vector",
                repositoryOpts: {
                    repo: "https://helm.vector.dev"
                },
                version: "0.33.0",
                values: {
                    role: "Aggregator",
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/vector",
                        tag: "0.38.0-distroless-libc"
                    },
                    replicas: 1,
                    podLabels: podlabels,
                    resources: {
                        limits: { cpu: "100m", memory: "256Mi" },
                        requests: { cpu: "100m", memory: "256Mi" }
                    },
                    updateStrategy: {
                        type: "RollingUpdate",
                        rollingUpdate: { partition: 0 }
                    },
                    service: {
                        enabled: true,
                        type: "LoadBalancer",
                        annotations: { "metallb.universe.tf/allow-shared-ip": "shared" },
                        loadBalancerIP: "192.168.0.105"
                    },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: {
                            beats_logstash_tcp: {
                                type: "logstash",
                                address: "0.0.0.0:5045",
                                connection_limit: 200,
                                keepalive: { time_secs: 30 },
                                receive_buffer_bytes: 65536
                            }
                        },
                        sinks: {
                            beats_json_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["beats_logstash_tcp"],
                                bulk: { action: "index", index: "packetbeat-%Y-%m-%d" },
                                endpoint: "https://opensearch-master.opensearch:9200",
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
                    persistence: { enabled: true, storageClassName: "vsphere-san-sc", size: "7Gi" },
                    podMonitor: {
                        enabled: true,
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
                repositoryOpts: {
                    repo: "https://helm.vector.dev"
                },
                version: "0.33.0",
                values: {
                    role: "Agent",
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/vector",
                        tag: "0.38.0-distroless-libc"
                    },
                    podLabels: podlabels,
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    nodeSelector: { "node-role.kubernetes.io/control-plane": "true" },
                    tolerations: [{ key: "CriticalAddonsOnly", operator: "Exists" }],
                    service: { enabled: false },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: { kubernetes_audit: { type: "file", max_line_bytes: 65536, include: ["/var/lib/rancher/rke2/server/logs/audit.log"] } },
                        transforms: {
                            kubernetes_audit_json: {
                                type: "remap",
                                inputs: ["kubernetes_audit"],
                                source: `. = parse_json!(.message)`
                            }
                        },
                        sinks: {
                            kubernetes_logs_loki: {
                                type: "loki",
                                inputs: ["kubernetes_audit_json"],
                                endpoint: "http://loki-distributor.logging:3100",
                                labels: { scrape_job: "kube-audit", cluster: "rke-it-prd-infra-shared-01" },
                                compression: "none",
                                healthcheck: { enabled: false },
                                encoding: { codec: "json", except_fields: ["source_type"] },
                                buffer: { type: "disk", max_size: 4294967296, when_full: "block" },
                                batch: { max_events: 1024, timeout_secs: 3 }
                            }
                        }
                    },
                    extraVolumes: [
                        {
                            name: "varlibdockercontainers",
                            hostPath: {
                                path: "/var/lib/rancher/rke2/server/logs"
                            }
                        }
                    ],
                    extraVolumeMounts: [
                        {
                            name: "varlibdockercontainers",
                            mountPath: "/var/lib/rancher/rke2/server/logs",
                            readOnly: true
                        }
                    ],
                    persistence: { hostPath: { path: "/var/lib/vector/kube-audit" } },
                    podMonitor: {
                        enabled: true,
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

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });