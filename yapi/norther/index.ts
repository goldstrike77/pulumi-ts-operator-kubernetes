import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "yapi",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        configmap: {
            metadata: {
                name: "yapi-conf",
                namespace: "yapi",
                annotations: {},
                labels: {}
            },
            data: {
                "config.json": `{
  "plugins": [{
      "name": "ms-oauth",
      "options": {
        "type": "oauth2",
        "hostscheme": "https",
        "hostname": "login.partner.microsoftonline.cn",
        "authPath": "/8209af61-7dcc-42b8-8cdf-0745c5096e95/oauth2/v2.0/authorize",
        "tokenPath": "/8209af61-7dcc-42b8-8cdf-0745c5096e95/oauth2/v2.0/token",
        "redirectUri": "https://yapi.example.com/api/plugin/oauth2/callback",
        "appId": "d4b1f920-ecf9-4386-adbc-e695565984ab",
        "appSecret": "${config.require("appSecret")}"
      }
    }
  ],
  "adminAccount": "admin@admin.com",
  "adminPassword": "password",
  "closeRegister": true,
  "port": 3000,
  "db": {
    "connectString": "mongodb://yapi:${config.require("yapiPassword")}@mongodb-headless/yapi?authSource=yapi&replicaSet=rsYapi"
  },
  "mail": {
    "enable": false,
    "auth": {}
  }
}
`
            }
        },
        helm: {
            namespace: "yapi",
            name: "mongodb",
            chart: "mongodb",
            repository: "https://charts.bitnami.com/bitnami",
            version: "13.9.4",
            values: {
                image: { tag: "4.4.15-debian-10-r8" },
                architecture: "replicaset",
                replicaSetName: "rsYapi",
                replicaCount: 3,
                auth: {
                    enabled: true,
                    rootUser: "root",
                    rootPassword: config.require("rootPassword"),
                    usernames: ["yapi"],
                    passwords: [config.require("yapiPassword")],
                    databases: ["yapi"]
                },
                disableSystemLog: true,
                podLabels: { customer: "demo", environment: "dev", project: "API-Management", group: "Yapi", datacenter: "dc01", domain: "local" },
                podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "10000" }] },
                resources: {
                    limits: { cpu: "1000m", memory: "512Mi" },
                    requests: { cpu: "1000m", memory: "512Mi" }
                },
                livenessProbe: { initialDelaySeconds: 60, timeoutSeconds: 30 },
                readinessProbe: { initialDelaySeconds: 60, timeoutSeconds: 30 },
                persistence: { enabled: true, storageClass: "longhorn", size: "8Gi" },
                volumePermissions: {
                    enabled: true,
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    },
                },
                arbiter: { enabled: false },
                metrics: {
                    enabled: true,
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    },
                    livenessProbe: { initialDelaySeconds: 90, timeoutSeconds: 30 },
                    readinessProbe: { initialDelaySeconds: 90, timeoutSeconds: 30 },
                    serviceMonitor: {
                        enabled: true,
                        interval: "60s",
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
                        rules: []
                    }
                }
            }
        },
        deployment: {
            metadata: {
                labels: {
                    app: "yapi"
                },
                name: "yapi",
                namespace: "yapi"
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: {
                        app: "yapi"
                    }
                },
                strategy: {
                    rollingUpdate: {
                        maxSurge: 0,
                        maxUnavailable: 1
                    }
                },
                template: {
                    metadata: {
                        labels: {
                            app: "yapi",
                            customer: "demo",
                            datacenter: "dc01",
                            domain: "local",
                            environment: "dev",
                            group: "Yapi",
                            project: "API-Management"
                        }
                    },
                    spec: {
                        containers: [
                            {
                                image: "registry.cn-hangzhou.aliyuncs.com/goldstrike/yapi:v1.12.0@sha256:1490923231dec85317e6b64fcaf797aebe627341fd514c47aa9ea24d2ef6576c",
                                name: "yapi",
                                livenessProbe: {
                                    failureThreshold: 10,
                                    httpGet: {
                                        path: "/",
                                        port: "web",
                                        scheme: "HTTP"
                                    },
                                    initialDelaySeconds: 30,
                                    periodSeconds: 10,
                                    successThreshold: 1,
                                    timeoutSeconds: 30
                                },
                                readinessProbe: {
                                    failureThreshold: 3,
                                    httpGet: {
                                        path: "/",
                                        port: "web",
                                        scheme: "HTTP"
                                    },
                                    initialDelaySeconds: 30,
                                    periodSeconds: 10,
                                    successThreshold: 1,
                                    timeoutSeconds: 10
                                },
                                resources: {
                                    limits: { cpu: "500m", memory: "256Mi" },
                                    requests: { cpu: "500m", memory: "256Mi" }
                                },
                                ports: [
                                    {
                                        containerPort: 3000,
                                        protocol: "TCP",
                                        name: "web"
                                    }
                                ],
                                env: [
                                    { name: "HOME", value: "/home" },
                                    { name: "VENDORS", value: "/home/vendors" },
                                    { name: "NODE_TLS_REJECT_UNAUTHORIZED", value: "0" }
                                ],
                                volumeMounts: [
                                    {
                                        mountPath: "/home/config.json",
                                        name: "yapi-conf",
                                        subPath: "config.json"
                                    }
                                ]
                            }
                        ],
                        volumes: [
                            {
                                name: "yapi-conf",
                                configMap: {
                                    defaultMode: 420,
                                    name: "yapi-conf"
                                }
                            }
                        ]
                    }
                }
            }
        },
        service: {
            metadata: {
                labels: {
                    app: "yapi"
                },
                name: "yapi",
                namespace: "yapi"
            },
            spec: {
                ports: [
                    {
                        name: "yapi",
                        port: 3000,
                        protocol: "TCP",
                        targetPort: 3000,
                    }
                ],
                selector: {
                    app: "yapi",
                }
            }
        },
        ingress: {
            metadata: {
                annotations: {
                    "nginx.ingress.kubernetes.io/backend-protocol": "HTTP"
                },
                labels: {
                    app: "yapi"
                },
                name: "yapi",
                namespace: "yapi"
            },
            spec: {
                ingressClassName: "nginx",
                rules: [
                    {
                        host: "yapi.example.com",
                        http: {
                            paths: [
                                {
                                    backend: {
                                        service: {
                                            name: "yapi",
                                            port: {
                                                number: 3000,
                                            }
                                        }
                                    },
                                    path: "/",
                                    pathType: "Prefix",
                                }
                            ]
                        }
                    }
                ]
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
        skipAwait: false,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    }, { dependsOn: [namespace] });
    // Create Kubernetes ConfigMap.
    const configmap = new k8s.core.v1.ConfigMap(deploy_spec[i].configmap.metadata.name, {
        metadata: deploy_spec[i].configmap.metadata,
        data: deploy_spec[i].configmap.data,
    }, { dependsOn: [release], customTimeouts: { create: "20m" } });
    // Create Deployment Resource.
    const deployment = new k8s.apps.v1.Deployment(deploy_spec[i].deployment.metadata.name, {
        metadata: deploy_spec[i].deployment.metadata,
        spec: deploy_spec[i].deployment.spec
    }, { dependsOn: [configmap] });
    // Create Service Resource.
    const service = new k8s.core.v1.Service(deploy_spec[i].service.metadata.name, {
        metadata: deploy_spec[i].service.metadata,
        spec: deploy_spec[i].service.spec
    }, { dependsOn: [deployment] });
    // Create Ingress Resource.
    const ingress = new k8s.networking.v1.Ingress(deploy_spec[i].ingress.metadata.name, {
        metadata: deploy_spec[i].ingress.metadata,
        spec: deploy_spec[i].ingress.spec
    }, { dependsOn: [deployment] });
}