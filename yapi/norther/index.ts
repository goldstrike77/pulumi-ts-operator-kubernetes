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
    "port": "3000",
    "adminAccount": "admin@admin.com",
    "db": {
      "servername": "mongodb",
      "DATABASE": "yapi",
      "port": "27017",
      "user": "yapi",
      "pass": "${config.require("yapiPassword")}",
      "authSource": "yapi"
    },
    "mail": {
      "enable": false,
      "auth": {}
    },
    "ldapLogin": {
        "enable": true,
        "server": "ldap://192.168.0.251",
        "baseDn": "CN=Administrator,CN=Users,DC=example,DC=com",
        "bindPassword": "${config.require("bindPassword")}",
        "searchDn": "OU=yapi,DC=example,DC=com",
        "searchStandard": "&(objectCategory=Person)(sAMAccountName=%s)",
        "emailPostfix": "",
        "emailKey": "",
        "usernameKey": "sAMAccountName"
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
            version: "13.1.4",
            values: {
                image: { tag: "4.4.15-debian-10-r8" },
                architecture: "standalone",
                auth: {
                    enabled: true,
                    rootUser: "root",
                    rootPassword: config.require("rootPassword"),
                    usernames: ["yapi"],
                    passwords: [config.require("yapiPassword")],
                    databases: ["yapi"]
                },
                disableSystemLog: true,
                updateStrategy: {
                    type: "RollingUpdate",
                    rollingUpdate: {
                        maxSurge: 0,
                        maxUnavailable: 1
                    }
                },
                podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "10000" }] },
                resources: {
                    limits: { cpu: "500m", memory: "1024Mi" },
                    requests: { cpu: "500m", memory: "1024Mi" }
                },
                livenessProbe: { initialDelaySeconds: 60, timeoutSeconds: 30 },
                readinessProbe: { enabled: false },
                persistence: { enabled: true, storageClass: "nfs-client", size: "8Gi" },
                volumePermissions: {
                    enabled: true,
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                },
                metrics: {
                    enabled: false,
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    livenessProbe: { initialDelaySeconds: 90, timeoutSeconds: 30 },
                    readinessProbe: { initialDelaySeconds: 90, timeoutSeconds: 30 },
                    serviceMonitor: {
                        enabled: true,
                        interval: "60s",
                        relabelings: [
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
                            group: "norther",
                            project: "cluster"
                        }
                    },
                    spec: {
                        containers: [
                            {
                                image: "registry.cn-hangzhou.aliyuncs.com/goldstrike/yapi:v1.8.0",
                                name: "yapi",
                                livenessProbe: {
                                    failureThreshold: 10,
                                    httpGet: {
                                        path: "/",
                                        port: "web",
                                        scheme: "HTTP"
                                    },
                                    initialDelaySeconds: 120,
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
                                    initialDelaySeconds: 120,
                                    periodSeconds: 10,
                                    successThreshold: 1,
                                    timeoutSeconds: 10
                                },
                                resources: {
                                    limits: { cpu: "1000m", memory: "1024Mi" },
                                    requests: { cpu: "1000m", memory: "1024Mi" }
                                },
                                ports: [
                                    {
                                        containerPort: 3000,
                                        protocol: "TCP",
                                        name: "web"
                                    }
                                ],
                                env: [
                                    { name: "HOME", value: "/yapi" },
                                    { name: "VENDORS", value: "/yapi/vendors" },
                                    { name: "VERSION", value: "1.10.2" }
                                ],
                                volumeMounts: [
                                    {
                                        mountPath: "/yapi/config.json",
                                        name: "yapi-conf",
                                        subPath: "config.json"
                                    },
                                    {
                                        mountPath: "/yapi",
                                        name: "data-storage"
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
                            },
                            {
                                name: "data-storage",
                                persistentVolumeClaim: {
                                    claimName: "yapi"
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
        },
        pvc: {
            metadata: {
                name: "yapi",
                namespace: "yapi",
                annotations: {},
                labels: {}
            },
            spec: {
                accessModes: ["ReadWriteOnce"],
                storageClassName: "nfs-client",
                resources: {
                    requests: { storage: "8Gi" }
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
    // Create Kubernetes PersistentVolumeClaim.
    const persistentvolumeclaim = new k8s.core.v1.PersistentVolumeClaim(deploy_spec[i].pvc.metadata.name, {
        metadata: deploy_spec[i].pvc.metadata,
        spec: deploy_spec[i].pvc.spec,
    }, { dependsOn: [release] });
    // Create Kubernetes ConfigMap.
    const configmap = new k8s.core.v1.ConfigMap(deploy_spec[i].configmap.metadata.name, {
        metadata: deploy_spec[i].configmap.metadata,
        data: deploy_spec[i].configmap.data,
    }, { dependsOn: [persistentvolumeclaim] });
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