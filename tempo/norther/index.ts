import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "tracing",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "tracing",
            name: "tempo",
            chart: "tempo-distributed",
            repository: "https://grafana.github.io/helm-charts",
            version: "0.27.10",
            values: {
                tempo: {
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" }
                },
                ingester: {
                    replicas: 2,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "200m", memory: "512Mi" },
                        requests: { cpu: "200m", memory: "512Mi" }
                    },
                    persistence: {
                        enabled: true,
                        size: "10Gi",
                        storageClass: "nfs-client"
                    },
                    config: { replication_factor: 2 }
                },
                metricsGenerator: {
                    enabled: true,
                    replicas: 1,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    }
                },
                distributor: {
                    replicas: 2,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "200m", memory: "128Mi" },
                        requests: { cpu: "200m", memory: "128Mi" }
                    }
                },
                compactor: {
                    replicas: 1,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    config: {
                        compaction: { block_retention: "168h" }
                    }
                },
                querier: {
                    replicas: 2,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "500m", memory: "1024Mi" },
                        requests: { cpu: "500m", memory: "1024Mi" }
                    }
                },
                queryFrontend: {
                    query: {
                        enabled: false,
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        }
                    },
                    replicas: 1,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" }
                },
                search: { enabled: true },
                multitenancyEnabled: false,
                traces: {
                    jaeger: {
                        grpc: { enabled: true },
                        thriftBinary: { enabled: true },
                        thriftCompact: { enabled: true },
                        thriftHttp: { enabled: true }
                    },
                    zipkin: { enabled: true },
                    otlp: {
                        http: { enabled: true },
                        grpc: { enabled: true }
                    },
                    opencensus: { enabled: false }
                },
                server: {
                    logLevel: "info",
                    grpc_server_max_recv_msg_size: 4194304,
                    grpc_server_max_send_msg_size: 4194304
                },
                storage: {
                    trace: {
                        backend: "s3",
                        s3: {
                            bucket: "tempo",
                            endpoint: "minio.minio.svc.cluster.local:9000",
                            region: "us-east-1",
                            access_key: config.require("AWS_ACCESS_KEY_ID"),
                            secret_key: config.require("AWS_SECRET_ACCESS_KEY"),
                            insecure: true,
                            insecure_skip_verify: false,
                            forcepathstyle: true,
                            hedge_requests_at: "1000ms",
                            hedge_requests_up_to: 2
                        }
                    }
                },
                memcached: {
                    enabled: true,
                    replicas: 1,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "1000m", memory: "2048Mi" },
                        requests: { cpu: "1000m", memory: "2048Mi" }
                    }
                },
                memcachedExporter: {
                    enabled: true,
                    resources: {
                        limits: { cpu: "200m", memory: "64Mi" },
                        requests: { cpu: "200m", memory: "64Mi" }
                    }
                },
                metaMonitoring: {
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
                    }
                },
                prometheusRule: {
                    enabled: false,
                    groups: []
                },
                minio: { enabled: false },
                gateway: { enabled: false }
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
    // Create Release Resource.
    const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
        namespace: deploy_spec[i].helm.namespace,
        name: deploy_spec[i].helm.name,
        chart: deploy_spec[i].helm.chart,
        version: deploy_spec[i].helm.version,
        values: deploy_spec[i].helm.values,
        skipAwait: true,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    }, { dependsOn: [namespace] });
}