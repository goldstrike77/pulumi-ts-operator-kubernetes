import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as fs from 'fs';

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "visualization",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "grafana-ldap-toml",
                    namespace: "visualization",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "ldap-toml": ""
                },
                stringData: {}
            }
        ],
        configmap: [
            {
                metadata: {
                    name: "grafana-dashboards-mysql",
                    namespace: "visualization",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "MySQL_Overview.json": fs.readFileSync('./dashboards/database/MySQL_Overview.json', 'utf8')
                }
            },
            {
                metadata: {
                    name: "grafana-dashboards-postgres",
                    namespace: "visualization",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "PostgreSQL_Overview.json": fs.readFileSync('./dashboards/database/PostgreSQL_Overview.json', 'utf8')
                }
            },
            {
                metadata: {
                    name: "grafana-dashboards-universal",
                    namespace: "visualization",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "WebSite_Overview.json": fs.readFileSync('./dashboards/universal/WebSite_Overview.json', 'utf8'),
                    "Redis_Overview.json": fs.readFileSync('./dashboards/universal/Redis_Overview.json', 'utf8'),
                    "Memcached_Overview.json": fs.readFileSync('./dashboards/universal/Memcached_Overview.json', 'utf8'),
                    "Loki_Kubernetes_Logs.json": fs.readFileSync('./dashboards/universal/Loki_Kubernetes_Logs.json', 'utf8')
                }
            },
            {
                metadata: {
                    name: "grafana-dashboards-platform",
                    namespace: "visualization",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "Kubernetes_Cluster.json": fs.readFileSync('./dashboards/platform/Kubernetes_Cluster.json', 'utf8'),
                    "VMware_vSphere_Overview.json": fs.readFileSync('./dashboards/platform/VMware_vSphere_Overview.json', 'utf8')
                }
            },
            {
                metadata: {
                    name: "grafana-dashboards-operatingsystem",
                    namespace: "visualization",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "Linux_System_Overview.json": fs.readFileSync('./dashboards/operatingsystem/Linux_System_Overview.json', 'utf8'),
                    "Linux_Disk_Performance.json": fs.readFileSync('./dashboards/operatingsystem/Linux_Disk_Performance.json', 'utf8'),
                    "Linux_Network_Overview.json": fs.readFileSync('./dashboards/operatingsystem/Linux_Network_Overview.json', 'utf8'),
                    "Linux_Disk_Space.json": fs.readFileSync('./dashboards/operatingsystem/Linux_Disk_Space.json', 'utf8')
                }
            },
            {
                metadata: {
                    name: "grafana-dashboards-others",
                    namespace: "visualization",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "Cross_Server_Graphs.json": fs.readFileSync('./dashboards/others/Cross_Server_Graphs.json', 'utf8')
                }
            }
        ],
        helm: {
            namespace: "visualization",
            name: "grafana",
            chart: "grafana",
            repository: "https://grafana.github.io/helm-charts",
            version: "6.44.10",
            values: {
                replicas: 1,
                deploymentStrategy: {
                    type: "RollingUpdate",
                    rollingUpdate: {
                        maxSurge: 0,
                        maxUnavailable: 1
                    }
                },
                image: { repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/grafana", tag: "9.2.15" },
                podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
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
                ingress: {
                    enabled: true,
                    ingressClassName: "nginx",
                    annotations: {
                        "nginx.ingress.kubernetes.io/rewrite-target": "/$1",
                        "nginx.ingress.kubernetes.io/use-regex": "true"
                    },
                    path: "/grafana/?(.*)",
                    hosts: ["norther.example.com"],
                },
                resources: {
                    limits: { cpu: "200m", memory: "384Mi" },
                    requests: { cpu: "200m", memory: "384Mi" }
                },
                persistence: {
                    enabled: true,
                    storageClassName: "longhorn",
                    size: "8Gi"
                },
                initChownData: { enabled: true },
                adminUser: "admin",
                adminPassword: config.require("adminPassword"),
                plugins: [
                    "grafana-piechart-panel",
                    "camptocamp-prometheus-alertmanager-datasource",
                    "grafana-oncall-app"
                ],
                datasources: {
                    "datasources.yaml": {
                        apiVersion: 1,
                        datasources: [
                            {
                                name: "DS_TEMPO",
                                type: "tempo",
                                access: "proxy",
                                url: "http://tempo-query-frontend.tracing.svc.cluster.local:3100",
                                version: 1
                            },
                            {
                                name: "DS_LOKI",
                                type: "loki",
                                access: "proxy",
                                url: "http://loki-query-frontend.logging.svc.cluster.local:3100",
                                version: 1,
                                jsonData: {
                                    maxLines: 5000
                                },
                                derivedFields: {
                                    datasourceUid: "",
                                    matcherRegex: "(?:traceID|trace_id)=(\\w+)",
                                    name: "TraceID",
                                    url: "${__value.raw}"
                                }
                            },
                            {
                                name: "DS_PROMETHEUS",
                                type: "prometheus",
                                access: "proxy",
                                url: "http://thanos-query-frontend.monitoring.svc.cluster.local:9090",
                                version: 1
                            },
                            {
                                name: "DS_ALERTMANAGER",
                                type: "camptocamp-prometheus-alertmanager-datasource",
                                access: "proxy",
                                url: "http://kube-prometheus-stack-alertmanager.monitoring.svc.cluster.local:9093",
                                version: 1,
                                jsonData: {
                                    severity_critical: "p1",
                                    severity_high: "p2",
                                    severity_warning: "p3",
                                    severity_info: "p4"
                                }
                            }
                        ]
                    }
                },
                "grafana.ini": {
                    "auth.azuread": {
                        name: "Azure AAD",
                        enabled: true,
                        allow_sign_up: true,
                        client_id: "707fb37f-06f3-4fad-842b-59f95b03a9cb",
                        client_secret: config.require("client_secret"),
                        auth_url: "https://login.microsoftonline.com/1028c8b9-5db4-4ade-bd31-524340b7cc0d/oauth2/v2.0/authorize",
                        token_url: "https://login.microsoftonline.com/1028c8b9-5db4-4ade-bd31-524340b7cc0d/oauth2/v2.0/token",
                        role_attribute_strict: false
                    },
                    server: {
                        root_url: "https://norther.example.com/grafana",
                    },
                    paths: {
                        data: "/var/lib/grafana/",
                        logs: "/var/log/grafana",
                        plugins: "/var/lib/grafana/plugins",
                        provisioning: "/etc/grafana/provisioning",
                    },
                    dataproxy: {
                        timeout: "60",
                        keep_alive_seconds: "60"
                    },
                    analytics: {
                        check_for_updates: false,
                        reporting_enabled: false
                    },
                    log: { mode: "console", level: "warn" },
                    grafana_net: { url: "https://grafana.net" },
                    user: {
                        default_theme: "dark",
                        home_page: ""
                    },
                    tracing: { type: "jaeger" },
                    "tracing.jaeger": {
                        address: "tempo-distributor.tracing.svc.cluster.local:6831",
                        zipkin_propagation: true
                    }
                },
                sidecar: {
                    resources: {
                        limits: { cpu: "50m", memory: "128Mi" },
                        requests: { cpu: "50m", memory: "128Mi" }
                    },
                    dashboards: { enabled: true, label: "grafana_dashboard" }
                }
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
    // Create Kubernetes ConfigMap.
    for (var configmap_index in deploy_spec[i].configmap) {
        const configmap = new k8s.core.v1.ConfigMap(deploy_spec[i].configmap[configmap_index].metadata.name, {
            metadata: deploy_spec[i].configmap[configmap_index].metadata,
            data: deploy_spec[i].configmap[configmap_index].data,
        }, { dependsOn: [namespace] });
    }
    // Create Kubernetes Secret.
    // for (var secret_index in deploy_spec[i].secret) {
    //     const secret = new k8s.core.v1.Secret(deploy_spec[i].secret[secret_index].metadata.name, {
    //         metadata: deploy_spec[i].secret[secret_index].metadata,
    //         type: deploy_spec[i].secret[secret_index].type,
    //         data: deploy_spec[i].secret[secret_index].data,
    //         stringData: deploy_spec[i].secret[secret_index].stringData
    //     }, { dependsOn: [namespace] });
    // }
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