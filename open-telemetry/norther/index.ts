import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "open-telemetry",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "open-telemetry",
            name: "opentelemetry-operator",
            chart: "opentelemetry-operator",
            repository: "https://open-telemetry.github.io/opentelemetry-helm-charts",
            version: "0.20.4",
            values: {
                replicaCount: 1,
                manager: {
                    image: {
                        repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/opentelemetry-operator"
                    },
                    resources: {
                        limits: { cpu: "200m", memory: "128Mi" },
                        requests: { cpu: "200m", memory: "128Mi" }
                    },
                    serviceMonitor: {
                        enabled: true
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    prometheusRule: {
                        enabled: true,
                        defaultRules: {
                            enabled: true
                        }
                    }
                },
                kubeRBACProxy: {
                    enabled: true,
                    image: {
                        repository: "sls-registry.cn-beijing.cr.aliyuncs.com/opentelemetry-operator/kube-rbac-proxy"
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    }
                },
                admissionWebhooks: {
                    certManager: { enabled: false }
                }
            }
        },
        crd: [
            {
                apiVersion: "opentelemetry.io/v1alpha1",
                kind: "Instrumentation",
                metadata: {
                    name: "instrumentation",
                    namespace: "open-telemetry"
                },
                spec: {
                    exporter: {
                        endpoint: "http://opentelemetry-daemonset-collector.open-telemetry.svc.cluster.local:4317",
                    },
                    propagators: ["tracecontext", "baggage", "b3"],
                    sampler: {
                        type: "always_on"
                    },
                    argument: "0.25"
                }
            },
            {
                apiVersion: "opentelemetry.io/v1alpha1",
                kind: "OpenTelemetryCollector",
                metadata: {
                    name: "opentelemetry",
                    namespace: "open-telemetry"
                },
                spec: {
                    mode: "daemonset",
                    hostNetwork: true,
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    config: `
receivers:
  otlp:
    protocols:
      grpc:
      http:
processors:
  memory_limiter:
    check_interval: 1s
    limit_percentage: 75
    spike_limit_percentage: 15
  batch:
    send_batch_size: 10000
    timeout: 10s
exporters:
  otlp:
    endpoint: "http://tempo-distributor.tracing.svc.cluster.local:4317"
    tls:
      insecure: true
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: []
      exporters: [otlp]
`
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
    const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
        namespace: deploy_spec[i].helm.namespace,
        name: deploy_spec[i].helm.name,
        chart: deploy_spec[i].helm.chart,
        version: deploy_spec[i].helm.version,
        values: deploy_spec[i].helm.values,
        skipAwait: false,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    }, { dependsOn: [namespace] });
    for (var crd_index in deploy_spec[i].crd) {
        const crd = new k8s.apiextensions.CustomResource(deploy_spec[i].crd[crd_index].metadata.name, {
            apiVersion: deploy_spec[i].crd[crd_index].apiVersion,
            kind: deploy_spec[i].crd[crd_index].kind,
            metadata: deploy_spec[i].crd[crd_index].metadata,
            spec: deploy_spec[i].crd[crd_index].spec,
        }, { dependsOn: [release] });
    }
}