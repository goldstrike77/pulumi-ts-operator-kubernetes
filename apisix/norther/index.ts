import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "apisix",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        class: {
            apiVersion: "networking.k8s.io/v1",
            kind: "IngressClass",
            metadata: {
                name: "apisix",
                annotations: {},
                labels: {}
            },
            spec: {
                controller: "apisix.apache.org/ingress-controller"
            }
        },
        secret: {
            metadata: {
                name: "private-cert",
                namespace: "apisix",
                annotations: {},
                labels: {}
            },
            type: "Opaque",
            data: {
                "cacert": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURSRENDQWl3Q0NRQ0xMNHQ3MUp0MW9qQU5CZ2txaGtpRzl3MEJBUXNGQURCa01Rc3dDUVlEVlFRR0V3SlkKV0RFTk1Bc0dBMVVFQ0F3RVRXRnljekVXTUJRR0ExVUVCd3dOVFc5MWJuUWdUMng1YlhCMWN6RVFNQTRHQTFVRQpDZ3dIUTI5dGNHRnVlVEVOTUFzR0ExVUVDd3dFVlc1cGRERU5NQXNHQTFVRUF3d0VVazlQVkRBZUZ3MHlNREEyCk1URXdPVEUyTXpsYUZ3MDBNREEyTVRFd09URTJNemxhTUdReEN6QUpCZ05WQkFZVEFsaFlNUTB3Q3dZRFZRUUkKREFSTllYSnpNUll3RkFZRFZRUUhEQTFOYjNWdWRDQlBiSGx0Y0hWek1SQXdEZ1lEVlFRS0RBZERiMjF3WVc1NQpNUTB3Q3dZRFZRUUxEQVJWYm1sME1RMHdDd1lEVlFRRERBUlNUMDlVTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGCkFBT0NBUThBTUlJQkNnS0NBUUVBMGdwSzNMREZZS2liNVhaczBJbEVML016eDRXZExoaEhDUGVpWU5OS2t4S24KVmFVS0UrTS9CMUsraFRabVlMZkc1VkFPWmdrZHBXcjdwZm1QU045cVd5S05xZGVyQUh6UXU4QTRZYnhiU1NRVgpES1ZjcFFDYUhFZmpjRUtqbDB6RElYMU1LekppQXJKNFlQVENpeGdEbG5pMTk1Qm1EQncxMDBZR2EzancrRHhTCkxMbFI4VEE3eWVMdS8wTm1EVTMxLzN1NWZBVlorVnFzbmx2bitySjg3Wnpka2txNEVQUFhvanBiRElvbCtUTDEKQklXK0tOTE13WjRnOEFHbWR6ZlJQK3p0bU5xbksvTTdqK0toSzdYSTJZcHZrZGhTQ1htZHgvZ1VzNVM4eG1oUApYS2NTTEZZaFdzeGozd285WlhzbXdBamZRYVM2WmZ5NCtGN2p1bkJsRFFJREFRQUJNQTBHQ1NxR1NJYjNEUUVCCkN3VUFBNElCQVFCRHJGL2NlSFd6WHdvYkhvUExMd2krbUp4R3NTNlJPVTNRczJzaUxkQnozNzROTWZBMlN0a2UKTWo0dU9UdmN2Z3psL3lNTVZMZy9zUVhMeW8vZ0VhOVlhNFhkWDRxTmlEY0NwM3g2SjNnbWtsMGtxTzY4N3lRSgpFdW1FV1VXcmZ4Z2p4dEhSMUMvY1RFZ3FjNkYwUldHc1YrMjNkT0JvTG9RQmt2NGNUbGR5ajBGTERJZElId2p3CkFXM1B5MTJZb2JKNTRsdjhqbGZhVUVmNXg3Z3d5TW55MDR1aDRoTTVNR01WR29mK3dRWnVNNGJZMzBkVjUyNnkKQU9xeDEzY0hKek1CRW14aFdRNWdkUDNjOXdKcVVuSSswMDJPTjdiWnI5bVV0Q0Vab0JTdTQxb1Q4bGhjNG00ZApZQjJjak5wTXVSTGpjUzZHZTVyQUJweUFGWW9UVGhYdgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t",
                "key": "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBdmRhN2lnTTZBVGIrVy9JbDVFUFRoYXNkbFVuMElIUFlkY3dCQ0ZFYWNBTTNkVWpwCjVqNDM0emVTZjBKdTNObnhlRlhUYXNRUHlFUFhTOHVFeTZWa2ZOTUQyVExMRUN2WXFzUkFQeHk2SVJtZE9qdVkKWDBNTzRBSkhLdnUrMStkMVBwRll5cUdCOEtzcFdvRGFLUGlDWE1JczhFZ3NaRC9nTEMvazg1YVA0ZUZ2RThCcQozTkt1dEpNVFN4NmFHVUF6dE8ranc1bnN5TVlmTnFoeDZHRUVFSlA2ZEVDaWNKM1dnSVFuWjFiZXBCYTlsY2twCnNYd1RLOWMzVlp5TE1meUNRNFk2TlhEYXY1bkJGbTIxdVFUZmN4bVdNNmovcDFDdGdvQkFSMEIrNTNBL1dRMXMKSU4xR1R1V3JKWVJFWmkzbldvRmFjTHdhclpqRWUxcFFiMi9DNndJREFRQUJBb0lCQURiaFZ3SUZBTVhOSWlkdQpqMm0zK2ZSUWpaTFUrRkJSYlNoUXU1T3Q3cGluTldjZ2x3M0t1dGxpL1dUd3paL25HWm1TSmpaZFM3cTNjZ3dsClg5U0hrYzlNS1hhbTZuRllXNkN5YjJoUFk3ZWg4Z1FkcW1VUHU4TWlwWFJWcHN3L3kzTTFEWmcyckp2b3YyRzgKa2xUNTBxWUNOSCthUGNzVmREY1IrWHc1OElwNTR2a3MwbmppSzlkdEg1Z1I3cVNTZHg3bDRFMTJiVE01ZXRXVwo5RHFsV3hNMkdzVHprZkJkZnZwMXpqblhKUWdvNFJNQ3RQMTROQ1pyZzJhalduekdHN3ZhZVRyTlBqaVU1WDBQClMzUnd3bHdET0phSk41YkdMZHI0M0hvK1FpcW16ejU5R2VJMHhrVDlwZEpXaGEvcVYwVWpQNHRGUlNjY0ROZlIKTmsxUHI3RUNnWUVBK1RDbVp6cUVRNURaeUdiVnpMTm0wY1lxY0FQOC9oTEJTdm5Qb0dDWXdNQTh4QnVIRHlmLwpGdWZsbngrRWJ0MjFCbi9ydUcxWHh5VEhndiswb3M5b1JhNE5USEorZE5VUzJweDdhOVlxbEVQRXMvYU9TT1FYCitCM3JPWHkxMWFTV0ppVEl6V1p1YWpKL1BOZ3lHalZZMi82TUJnZVhHQlhDbDhIdWNuUHYrUDhDZ1lFQXd3YmIKZkNweUJzM2h5Ym9pRVNycjVmUlM1cE9OdzFDZGJ3dHpHaGlBbVQ0MzhoRzZVZW0rOFczcEZUQjdUSVNOVU1YOApDS2M1S2k5VStFVzFUYVNYVDRCV01DU0dWM1huRFNZR21wVjZ4NG9xWGRtOU5XWGlGbXZRbjB6Nk5pQTRoYmM0Cjk3T0JodThVNmp3dTJBZ0dlNHNwbkw5WE54OTdVZkE1d3orWnFoVUNnWUFDMWlUdXcrSEJpeUtQZjJ3cm1sY3YKU0J3dmpqd1JBRkdtOHRVRU5GVkl6R2RrckJPTGZwOE91YkVKY0toblFxck8yaUhxeFlQY1JuVG03dFkxakRyWgpvRE9TalRNWFRWMmJrM0JzTjlIZ1FpMDVCek56YlBWQTQ4Wkxyem02cHRiMnREQjg5ZytIc2U5MDE5a3FKelZOCnU4WUlRNG5hd2xTbXVaUm5SUjZVTFFLQmdFQThkL3FUdUc4SlRQODJzWlhaLzAwRWhuR3YxQmVxNjgveGczM3EKNkNDUlg3ZjVvdGJzR0pwSXkyYlJTeXRPMVlUdlVTNUFkaEd3K1ZtMURCeUF3OTNKdFpteHpoWHNuYWUxQ0tQTgo3RnpnNDBkNk9sbm1MdXVYbzJWMDQwMEVtOWxmR2dKc081T0lGK2wyM1M4R3BhdjNrRU15dXJWTFIwRWIwTXJBCm5ncHBBb0dBYnBtTEhDa0N5WkFiM25qNmtEeW9DbnhEK0RacFFUcG1UOG5ZWWs4dkVQbEtTQ0c2NWNLb2poTE0KSy9uR1BOOWh5VjBlQVhoOWZ6amdDNk41NHNDQXRjOXBJd2s0bFhPenVVbVhoZ0hFa3ZlekNCWnVBMmRuZWdxZApzdXY1cnYrUS9GNUkwaDZBcnVJZnh5R01zRjVnek1Ddm0xVGs3aDBpUGZweStadHJqWlU9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0t",
                "crt": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURoVENDQW0yZ0F3SUJBZ0lKQU5JSU9sazVxWmJRTUEwR0NTcUdTSWIzRFFFQkN3VUFNR1F4Q3pBSkJnTlYKQkFZVEFsaFlNUTB3Q3dZRFZRUUlEQVJOWVhKek1SWXdGQVlEVlFRSERBMU5iM1Z1ZENCUGJIbHRjSFZ6TVJBdwpEZ1lEVlFRS0RBZERiMjF3WVc1NU1RMHdDd1lEVlFRTERBUlZibWwwTVEwd0N3WURWUVFEREFSU1QwOVVNQjRYCkRUSXhNVEl6TURBeU1qRXhOVm9YRFRReE1USXpNREF5TWpFeE5Wb3dYVEVMTUFrR0ExVUVCaE1DV0ZneEZUQVQKQmdOVkJBY01ERVJsWm1GMWJIUWdRMmwwZVRFY01Cb0dBMVVFQ2d3VFJHVm1ZWFZzZENCRGIyMXdZVzU1SUV4MApaREVaTUJjR0ExVUVBd3dRYVc1bWJ5NWxlR0Z0Y0d4bExtTnZiVENDQVNJd0RRWUpLb1pJaHZjTkFRRUJCUUFECmdnRVBBRENDQVFvQ2dnRUJBTDNXdTRvRE9nRTIvbHZ5SmVSRDA0V3JIWlZKOUNCejJIWE1BUWhSR25BRE4zVkkKNmVZK04rTTNrbjlDYnR6WjhYaFYwMnJFRDhoRDEwdkxoTXVsWkh6VEE5a3l5eEFyMktyRVFEOGN1aUVablRvNwptRjlERHVBQ1J5cjd2dGZuZFQ2UldNcWhnZkNyS1ZxQTJpajRnbHpDTFBCSUxHUS80Q3d2NVBPV2orSGhieFBBCmF0elNyclNURTBzZW1obEFNN1R2bzhPWjdNakdIemFvY2VoaEJCQ1QrblJBb25DZDFvQ0VKMmRXM3FRV3ZaWEoKS2JGOEV5dlhOMVdjaXpIOGdrT0dPalZ3MnIrWndSWnR0YmtFMzNNWmxqT28vNmRRcllLQVFFZEFmdWR3UDFrTgpiQ0RkUms3bHF5V0VSR1l0NTFxQlduQzhHcTJZeEh0YVVHOXZ3dXNDQXdFQUFhTkJNRDh3SlFZRFZSMFJCQjR3CkhJSU5LaTVsZUdGdGNHeGxMbU52YllJTFpYaGhiWEJzWlM1amIyMHdDUVlEVlIwVEJBSXdBREFMQmdOVkhROEUKQkFNQ0JlQXdEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBRjQxbXhMOC93RGJxaTl1emxDT3VpMm5uTEdUYm1uRQo0R2l5Y3U0S1JCbjhXbUNHTDBjVVdWcU5ubnQrR1pncEd6V3JSMnZ4L2dDZTJpbUg0MUloV01GUzhNTkUwOUpUCkVQNjhXZlFYMEtFaWN5WFlaenA0RnplTTZVRHh3Q0RhaDV3Mk9JM2N3djc1RVhHUHdDd1ZmU0llcVRRY1MwRVgKWFZiY2UwSEVuUC9LaCtENFAzODgwaCtXZ3R2aXhRNXFJTHNlZC9qSytxdkxCMGx5Q3U2a1c1bGRyMTJRYkQrTQpjeERZcFgwZUsxMTIyc3JhZmRoaGhBRmxlOXFIVjRFMGROTU9ZMk1EVEhLU25HbjB1bVh5cnUwQzNoaDU0VkYwCmk4MThkeTRKUVNMekpEcGlBVVNzVnB3bzJVUjRJaUxYbTVMOEgrOEN2VkgyLzFWSmo5c2o1czQ9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0="
            },
            stringData: {}
        },
        helm: [
            {
                namespace: "apisix",
                name: "apisix",
                chart: "apisix",
                repository: "https://charts.apiseven.com",
                version: "1.3.1",
                values: {
                    apisix: {
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "512Mi" },
                            requests: { cpu: "200m", memory: "512Mi" }
                        },
                        timezone: "Asia/Shanghai"
                    },
                    serviceAccount: { create: true },
                    admin: {
                        allow: {
                            ipList: ["127.0.0.1/24", "192.168.0.0/24"]
                        }
                    },
                    plugins: [
                        "api-breaker",
                        "authz-casbin",
                        "authz-keycloak",
                        "basic-auth",
                        "batch-requests",
                        "consumer-restriction",
                        "cors",
                        "echo",
                        //"error-log-logger",
                        "ext-plugin-post-req",
                        "ext-plugin-pre-req",
                        "fault-injection",
                        "file-logger",
                        "grpc-transcode",
                        "grpc-web",
                        "gzip",
                        "hmac-auth",
                        "http-logger",
                        "ip-restriction",
                        "jwt-auth",
                        "kafka-logger",
                        "key-auth",
                        "limit-conn",
                        "limit-count",
                        "limit-req",
                        "node-status",
                        "openid-connect",
                        "prometheus",
                        "proxy-cache",
                        "proxy-mirror",
                        "proxy-rewrite",
                        "real-ip",
                        "redirect",
                        "referer-restriction",
                        "request-id",
                        "request-validation",
                        "response-rewrite",
                        "serverless-post-function",
                        "serverless-pre-function",
                        //"skywalking",
                        "sls-logger",
                        "syslog",
                        "tcp-logger",
                        "traffic-split",
                        "ua-restriction",
                        "udp-logger",
                        "uri-blocker",
                        "wolf-rbac",
                        "zipkin",
                    ],
                    deployment: {
                        controlPlane: {
                            certsSecret: "private-cert",
                            cert: "crt",
                            certKey: "key"
                        }
                    },
                    gateway: {
                        type: "LoadBalancer",
                        tls: {
                            enabled: true,
                            existingCASecret: "private-cert",
                            certCAFilename: "cacert"
                        }
                    },
                    logs: {
                        enableAccessLog: false
                    },
                    serviceMonitor: {
                        enabled: true,
                        interval: "60s",
                        labels: {
                            customer: "demo",
                            environment: "dev",
                            project: "API-Gateway",
                            group: "apisix",
                            datacenter: "dc01",
                            domain: "local"
                        }
                    },
                    etcd: {
                        enabled: false,
                        host: ["http://etcd:2379"],
                        user: "root",
                        password: config.require("etcdPassword")
                    },
                    dashboard: {
                        enabled: true,
                        replicaCount: 1,
                        labelsOverride: {
                            customer: "demo",
                            environment: "dev",
                            project: "API-Gateway",
                            group: "apisix-dashboard",
                            datacenter: "dc01",
                            domain: "local"
                        },
                        config: {
                            conf: {
                                etcd: {
                                    endpoints: ["http://etcd:2379"],
                                    username: "root",
                                    password: config.require("etcdPassword")
                                },
                                log: {
                                    errorLog: {
                                        level: "warn"
                                    },
                                    accessLog: {
                                        level: "warn"
                                    }
                                }
                            },
                            authentication: {
                                users: [
                                    {
                                        username: "admin",
                                        password: config.require("dashboardPassword")
                                    }
                                ]
                            }
                        },
                        ingress: {
                            enabled: true,
                            className: "nginx",
                            annotations: {},
                            hosts: [
                                {
                                    host: "apisix.example.com",
                                    paths: ["/"]
                                }
                            ]
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    "ingress-controller": {
                        enabled: true,
                        replicaCount: 1,
                        config: {
                            logLevel: "error",
                            apisix: {
                                serviceNamespace: "apisix",
                                adminAPIVersion: "v3"
                            }
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
                            labels: {
                                customer: "demo",
                                environment: "dev",
                                project: "API-Gateway",
                                group: "apisix-ingress-controller",
                                datacenter: "dc01",
                                domain: "local"
                            }
                        }
                    }
                }
            },
            {
                namespace: "apisix",
                name: "etcd",
                chart: "etcd",
                repository: "https://charts.bitnami.com/bitnami",
                version: "8.11.1",
                values: {
                    auth: {
                        rbac: {
                            create: true,
                            allowNoneAuthentication: false,
                            rootPassword: config.require("etcdPassword")
                        }
                    },
                    logLevel: "warn",
                    replicaCount: 3,
                    resources: {
                        limits: { cpu: "300m", memory: "512Mi" },
                        requests: { cpu: "300m", memory: "512Mi" }
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "API-Gateway", group: "etcd", datacenter: "dc01", domain: "local" },
                    persistence: {
                        enabled: true,
                        storageClass: "longhorn",
                        size: "8Gi"
                    },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    },
                    metrics: {
                        enabled: true,
                        podMonitor: {
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
            }
        ]
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Ingress Class.
    const ingressclass = new k8s.apiextensions.CustomResource(deploy_spec[i].class.metadata.name, {
        apiVersion: deploy_spec[i].class.apiVersion,
        kind: deploy_spec[i].class.kind,
        metadata: deploy_spec[i].class.metadata,
        spec: deploy_spec[i].class.spec
    });
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create Kubernetes Secret.
    const secret = new k8s.core.v1.Secret(deploy_spec[i].secret.metadata.name, {
        metadata: deploy_spec[i].secret.metadata,
        type: deploy_spec[i].secret.type,
        data: deploy_spec[i].secret.data,
        stringData: deploy_spec[i].secret.stringData
    }, { dependsOn: [namespace] });
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