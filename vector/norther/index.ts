import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";
import * as fs from 'fs';

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
                name: "vector-agent",
                chart: "../../_chart/vector-0.14.0.tgz",
                // repository: "https://helm.vector.dev",
                repository: "", // Must be empty string if local chart.
                version: "0.14.0",
                values: {
                    role: "Agent",
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    service: { enabled: false },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: { kubernetes_logs: { type: "kubernetes_logs", max_line_bytes: 65536 } },
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
                            kubernetes_logs_loki: {
                                type: "loki",
                                inputs: ["kubernetes_json_labels"],
                                endpoint: "http://loki-distributor.logging.svc.cluster.local:3100",
                                labels: { scrape_job: "kubernetes-pods", cluster: "norther" },
                                compression: "none",
                                healthcheck: { enabled: false },
                                encoding: { codec: "json", except_fields: ["source_type"] },
                                buffer: { type: "disk", max_size: 4294967296, when_full: "drop_newest" }
                            }
                        }
                    },
                    extraVolumes: [
                        {
                            name: "varlibdockercontainers",
                            hostPath: {
                                path: "/data/docker/containers"
                            }
                        }
                    ],
                    extraVolumeMounts: [
                        {
                            name: "varlibdockercontainers",
                            mountPath: "/data/docker/containers",
                            readOnly: true
                        }
                    ],
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
                name: "vector-syslog",
                chart: "../../_chart/vector-0.14.0.tgz",
                // repository: "https://helm.vector.dev",
                repository: "", // Must be empty string if local chart.
                version: "0.14.0",
                values: {
                    role: "Aggregator",
                    replicas: 2,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    service: {
                        enabled: true,
                        type: "LoadBalancer",
                        annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
                    },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: { syslog_socket_udp: { type: "socket", address: "0.0.0.0:1514", max_length: 65536, mode: "udp", } },
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
                            syslog_json_loki: {
                                type: "loki",
                                inputs: ["syslog_json_udp"],
                                endpoint: "http://loki-distributor.logging.svc.cluster.local:3100",
                                labels: { scrape_job: "syslog" },
                                compression: "none",
                                healthcheck: { enabled: false },
                                encoding: { codec: "json", except_fields: ["source_type"] },
                                buffer: { type: "disk", max_size: 4294967296, when_full: "drop_newest" }
                            }
                        }
                    },
                    persistence: { enabled: true, storageClassName: "longhorn", size: "5Gi" },
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
            /**
                        {
                            namespace: "datadog",
                            name: "vector-aggregator-beats",
                            chart: "../../_chart/vector-0.13.1.tgz",
                            // repository: "https://helm.vector.dev",
                            repository: "", // Must be empty string if local chart.
                            version: "0.13.1",
                            values: "./vector-aggregator-beat.yaml"
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