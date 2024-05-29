import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';
import * as fs from 'fs';

let config = new pulumi.Config();

const podlabels = {
    customer: "it",
    environment: "prd",
    project: "Visualization",
    group: "grafana",
    datacenter: "cn-north",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "visualization",
                annotations: {},
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
        release: [
            {
                namespace: "visualization",
                name: "grafana",
                chart: "grafana",
                repositoryOpts: {
                    repo: "https://grafana.github.io/helm-charts"
                },
                version: "6.57.4",
                values: {
                    replicas: 1,
                    deploymentStrategy: {
                        type: "RollingUpdate",
                        rollingUpdate: {
                            maxSurge: 0,
                            maxUnavailable: 1
                        }
                    },
                    podLabels: podlabels,
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
                    ingress: {
                        enabled: false,
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
                        storageClassName: "vsphere-san-sc",
                        size: "7Gi"
                    },
                    initChownData: {
                        enabled: true,
                        image: {
                            repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/busybox",
                            tag: "1.36.1"
                        },
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    },
                    adminUser: "admin",
                    adminPassword: config.require("adminPassword"),
                    plugins: [
                        "apache-skywalking-datasource",
                        "camptocamp-prometheus-alertmanager-datasource",
                        "grafana-oncall-app",
                        "grafana-piechart-panel"
                    ],
                    datasources: {
                        "datasources.yaml": {
                            apiVersion: 1,
                            datasources: [
                                {
                                    name: "DS_TEMPO",
                                    type: "tempo",
                                    access: "proxy",
                                    url: "http://tempo-query-frontend.tracing:3100",
                                    version: 1
                                },
                                {
                                    name: "DS_LOKI",
                                    type: "loki",
                                    access: "proxy",
                                    url: "http://loki-query-frontend.logging:3100",
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
                                    url: "http://thanos-query-frontend.monitoring:9090",
                                    version: 1
                                },
                                {
                                    name: "DS_SKYWALKING_PromQL",
                                    type: "prometheus",
                                    url: "http://skywalking-oap.skywalking:9090",
                                    version: 1
                                },
                                {
                                    name: "DS_SKYWALKING_GraphQL",
                                    type: "apache-skywalking-datasource",
                                    jsonData: {
                                        URL: "http://skywalking-oap.skywalking:12800/graphql"
                                    },
                                    version: 1
                                },
                                {
                                    name: "DS_ALERTMANAGER",
                                    type: "camptocamp-prometheus-alertmanager-datasource",
                                    access: "proxy",
                                    url: "http://kube-prometheus-stack-alertmanager.monitoring:9093",
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
                            name: "Microsoft Entra ID",
                            enabled: true,
                            allow_sign_up: true,
                            client_id: "7d91f7eb-2dcb-4989-9b11-94bbf2322be5",
                            client_secret: config.require("client_secret"),
                            auth_url: "https://login.microsoftonline.com/e824e20c-c5d7-4a69-adb1-3494404763a5/oauth2/v2.0/authorize",
                            token_url: "https://login.microsoftonline.com/e824e20c-c5d7-4a69-adb1-3494404763a5/oauth2/v2.0/token",
                            role_attribute_strict: false
                        },
                        //server: {
                        //    root_url: "https://norther.example.com/grafana",
                        //},
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
                        log: { mode: "console", level: "info" },
                        //                        grafana_net: { url: "https://grafana.net" },
                        user: {
                            default_theme: "dark",
                            home_page: ""
                        },
                        // tracing: { type: "jaeger" },
                        // "tracing.jaeger": {
                        //     address: "tempo-distributor.tracing.svc.cluster.local:6831",
                        //     zipkin_propagation: true
                        // }
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
        ],
        customresource: [
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixRoute",
                metadata: {
                    name: "grafana",
                    namespace: "visualization"
                },
                spec: {
                    http: [
                        {
                            name: "root",
                            match: {
                                methods: ["GET", "HEAD", "POST"],
                                hosts: ["grafana.home.local"],
                                paths: ["/*"]
                            },
                            backends: [
                                {
                                    serviceName: "grafana",
                                    servicePort: 80,
                                    resolveGranularity: "service"
                                }
                            ]
                        }
                    ]
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const configmap = new k8s_module.core.v1.ConfigMap('ConfigMap', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [namespace] });