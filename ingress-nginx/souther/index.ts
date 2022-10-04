import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "ingress-nginx",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        // cat ca-cert.pem | base64 | tr -d '\n'
        secret: [
            {
                metadata: {
                    name: "internal-ca",
                    namespace: "ingress-nginx",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "internal-ca": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURSRENDQWl3Q0NRQ0xMNHQ3MUp0MW9qQU5CZ2txaGtpRzl3MEJBUXNGQURCa01Rc3dDUVlEVlFRR0V3SlkKV0RFTk1Bc0dBMVVFQ0F3RVRXRnljekVXTUJRR0ExVUVCd3dOVFc5MWJuUWdUMng1YlhCMWN6RVFNQTRHQTFVRQpDZ3dIUTI5dGNHRnVlVEVOTUFzR0ExVUVDd3dFVlc1cGRERU5NQXNHQTFVRUF3d0VVazlQVkRBZUZ3MHlNREEyCk1URXdPVEUyTXpsYUZ3MDBNREEyTVRFd09URTJNemxhTUdReEN6QUpCZ05WQkFZVEFsaFlNUTB3Q3dZRFZRUUkKREFSTllYSnpNUll3RkFZRFZRUUhEQTFOYjNWdWRDQlBiSGx0Y0hWek1SQXdEZ1lEVlFRS0RBZERiMjF3WVc1NQpNUTB3Q3dZRFZRUUxEQVJWYm1sME1RMHdDd1lEVlFRRERBUlNUMDlVTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGCkFBT0NBUThBTUlJQkNnS0NBUUVBMGdwSzNMREZZS2liNVhaczBJbEVML016eDRXZExoaEhDUGVpWU5OS2t4S24KVmFVS0UrTS9CMUsraFRabVlMZkc1VkFPWmdrZHBXcjdwZm1QU045cVd5S05xZGVyQUh6UXU4QTRZYnhiU1NRVgpES1ZjcFFDYUhFZmpjRUtqbDB6RElYMU1LekppQXJKNFlQVENpeGdEbG5pMTk1Qm1EQncxMDBZR2EzancrRHhTCkxMbFI4VEE3eWVMdS8wTm1EVTMxLzN1NWZBVlorVnFzbmx2bitySjg3Wnpka2txNEVQUFhvanBiRElvbCtUTDEKQklXK0tOTE13WjRnOEFHbWR6ZlJQK3p0bU5xbksvTTdqK0toSzdYSTJZcHZrZGhTQ1htZHgvZ1VzNVM4eG1oUApYS2NTTEZZaFdzeGozd285WlhzbXdBamZRYVM2WmZ5NCtGN2p1bkJsRFFJREFRQUJNQTBHQ1NxR1NJYjNEUUVCCkN3VUFBNElCQVFCRHJGL2NlSFd6WHdvYkhvUExMd2krbUp4R3NTNlJPVTNRczJzaUxkQnozNzROTWZBMlN0a2UKTWo0dU9UdmN2Z3psL3lNTVZMZy9zUVhMeW8vZ0VhOVlhNFhkWDRxTmlEY0NwM3g2SjNnbWtsMGtxTzY4N3lRSgpFdW1FV1VXcmZ4Z2p4dEhSMUMvY1RFZ3FjNkYwUldHc1YrMjNkT0JvTG9RQmt2NGNUbGR5ajBGTERJZElId2p3CkFXM1B5MTJZb2JKNTRsdjhqbGZhVUVmNXg3Z3d5TW55MDR1aDRoTTVNR01WR29mK3dRWnVNNGJZMzBkVjUyNnkKQU9xeDEzY0hKek1CRW14aFdRNWdkUDNjOXdKcVVuSSswMDJPTjdiWnI5bVV0Q0Vab0JTdTQxb1Q4bGhjNG00ZApZQjJjak5wTXVSTGpjUzZHZTVyQUJweUFGWW9UVGhYdgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t",
                    "tls.key": "",
                    "tls.crt": ""
                },
                stringData: {}
            },
            {
                metadata: {
                    name: "default-tls-secret",
                    namespace: "ingress-nginx",
                    annotations: {},
                    labels: {}
                },
                type: "kubernetes.io/tls",
                data: {
                    "internal-ca": "",
                    "tls.key": "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBdmRhN2lnTTZBVGIrVy9JbDVFUFRoYXNkbFVuMElIUFlkY3dCQ0ZFYWNBTTNkVWpwCjVqNDM0emVTZjBKdTNObnhlRlhUYXNRUHlFUFhTOHVFeTZWa2ZOTUQyVExMRUN2WXFzUkFQeHk2SVJtZE9qdVkKWDBNTzRBSkhLdnUrMStkMVBwRll5cUdCOEtzcFdvRGFLUGlDWE1JczhFZ3NaRC9nTEMvazg1YVA0ZUZ2RThCcQozTkt1dEpNVFN4NmFHVUF6dE8ranc1bnN5TVlmTnFoeDZHRUVFSlA2ZEVDaWNKM1dnSVFuWjFiZXBCYTlsY2twCnNYd1RLOWMzVlp5TE1meUNRNFk2TlhEYXY1bkJGbTIxdVFUZmN4bVdNNmovcDFDdGdvQkFSMEIrNTNBL1dRMXMKSU4xR1R1V3JKWVJFWmkzbldvRmFjTHdhclpqRWUxcFFiMi9DNndJREFRQUJBb0lCQURiaFZ3SUZBTVhOSWlkdQpqMm0zK2ZSUWpaTFUrRkJSYlNoUXU1T3Q3cGluTldjZ2x3M0t1dGxpL1dUd3paL25HWm1TSmpaZFM3cTNjZ3dsClg5U0hrYzlNS1hhbTZuRllXNkN5YjJoUFk3ZWg4Z1FkcW1VUHU4TWlwWFJWcHN3L3kzTTFEWmcyckp2b3YyRzgKa2xUNTBxWUNOSCthUGNzVmREY1IrWHc1OElwNTR2a3MwbmppSzlkdEg1Z1I3cVNTZHg3bDRFMTJiVE01ZXRXVwo5RHFsV3hNMkdzVHprZkJkZnZwMXpqblhKUWdvNFJNQ3RQMTROQ1pyZzJhalduekdHN3ZhZVRyTlBqaVU1WDBQClMzUnd3bHdET0phSk41YkdMZHI0M0hvK1FpcW16ejU5R2VJMHhrVDlwZEpXaGEvcVYwVWpQNHRGUlNjY0ROZlIKTmsxUHI3RUNnWUVBK1RDbVp6cUVRNURaeUdiVnpMTm0wY1lxY0FQOC9oTEJTdm5Qb0dDWXdNQTh4QnVIRHlmLwpGdWZsbngrRWJ0MjFCbi9ydUcxWHh5VEhndiswb3M5b1JhNE5USEorZE5VUzJweDdhOVlxbEVQRXMvYU9TT1FYCitCM3JPWHkxMWFTV0ppVEl6V1p1YWpKL1BOZ3lHalZZMi82TUJnZVhHQlhDbDhIdWNuUHYrUDhDZ1lFQXd3YmIKZkNweUJzM2h5Ym9pRVNycjVmUlM1cE9OdzFDZGJ3dHpHaGlBbVQ0MzhoRzZVZW0rOFczcEZUQjdUSVNOVU1YOApDS2M1S2k5VStFVzFUYVNYVDRCV01DU0dWM1huRFNZR21wVjZ4NG9xWGRtOU5XWGlGbXZRbjB6Nk5pQTRoYmM0Cjk3T0JodThVNmp3dTJBZ0dlNHNwbkw5WE54OTdVZkE1d3orWnFoVUNnWUFDMWlUdXcrSEJpeUtQZjJ3cm1sY3YKU0J3dmpqd1JBRkdtOHRVRU5GVkl6R2RrckJPTGZwOE91YkVKY0toblFxck8yaUhxeFlQY1JuVG03dFkxakRyWgpvRE9TalRNWFRWMmJrM0JzTjlIZ1FpMDVCek56YlBWQTQ4Wkxyem02cHRiMnREQjg5ZytIc2U5MDE5a3FKelZOCnU4WUlRNG5hd2xTbXVaUm5SUjZVTFFLQmdFQThkL3FUdUc4SlRQODJzWlhaLzAwRWhuR3YxQmVxNjgveGczM3EKNkNDUlg3ZjVvdGJzR0pwSXkyYlJTeXRPMVlUdlVTNUFkaEd3K1ZtMURCeUF3OTNKdFpteHpoWHNuYWUxQ0tQTgo3RnpnNDBkNk9sbm1MdXVYbzJWMDQwMEVtOWxmR2dKc081T0lGK2wyM1M4R3BhdjNrRU15dXJWTFIwRWIwTXJBCm5ncHBBb0dBYnBtTEhDa0N5WkFiM25qNmtEeW9DbnhEK0RacFFUcG1UOG5ZWWs4dkVQbEtTQ0c2NWNLb2poTE0KSy9uR1BOOWh5VjBlQVhoOWZ6amdDNk41NHNDQXRjOXBJd2s0bFhPenVVbVhoZ0hFa3ZlekNCWnVBMmRuZWdxZApzdXY1cnYrUS9GNUkwaDZBcnVJZnh5R01zRjVnek1Ddm0xVGs3aDBpUGZweStadHJqWlU9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0t",
                    "tls.crt": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURoVENDQW0yZ0F3SUJBZ0lKQU5JSU9sazVxWmJRTUEwR0NTcUdTSWIzRFFFQkN3VUFNR1F4Q3pBSkJnTlYKQkFZVEFsaFlNUTB3Q3dZRFZRUUlEQVJOWVhKek1SWXdGQVlEVlFRSERBMU5iM1Z1ZENCUGJIbHRjSFZ6TVJBdwpEZ1lEVlFRS0RBZERiMjF3WVc1NU1RMHdDd1lEVlFRTERBUlZibWwwTVEwd0N3WURWUVFEREFSU1QwOVVNQjRYCkRUSXhNVEl6TURBeU1qRXhOVm9YRFRReE1USXpNREF5TWpFeE5Wb3dYVEVMTUFrR0ExVUVCaE1DV0ZneEZUQVQKQmdOVkJBY01ERVJsWm1GMWJIUWdRMmwwZVRFY01Cb0dBMVVFQ2d3VFJHVm1ZWFZzZENCRGIyMXdZVzU1SUV4MApaREVaTUJjR0ExVUVBd3dRYVc1bWJ5NWxlR0Z0Y0d4bExtTnZiVENDQVNJd0RRWUpLb1pJaHZjTkFRRUJCUUFECmdnRVBBRENDQVFvQ2dnRUJBTDNXdTRvRE9nRTIvbHZ5SmVSRDA0V3JIWlZKOUNCejJIWE1BUWhSR25BRE4zVkkKNmVZK04rTTNrbjlDYnR6WjhYaFYwMnJFRDhoRDEwdkxoTXVsWkh6VEE5a3l5eEFyMktyRVFEOGN1aUVablRvNwptRjlERHVBQ1J5cjd2dGZuZFQ2UldNcWhnZkNyS1ZxQTJpajRnbHpDTFBCSUxHUS80Q3d2NVBPV2orSGhieFBBCmF0elNyclNURTBzZW1obEFNN1R2bzhPWjdNakdIemFvY2VoaEJCQ1QrblJBb25DZDFvQ0VKMmRXM3FRV3ZaWEoKS2JGOEV5dlhOMVdjaXpIOGdrT0dPalZ3MnIrWndSWnR0YmtFMzNNWmxqT28vNmRRcllLQVFFZEFmdWR3UDFrTgpiQ0RkUms3bHF5V0VSR1l0NTFxQlduQzhHcTJZeEh0YVVHOXZ3dXNDQXdFQUFhTkJNRDh3SlFZRFZSMFJCQjR3CkhJSU5LaTVsZUdGdGNHeGxMbU52YllJTFpYaGhiWEJzWlM1amIyMHdDUVlEVlIwVEJBSXdBREFMQmdOVkhROEUKQkFNQ0JlQXdEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBRjQxbXhMOC93RGJxaTl1emxDT3VpMm5uTEdUYm1uRQo0R2l5Y3U0S1JCbjhXbUNHTDBjVVdWcU5ubnQrR1pncEd6V3JSMnZ4L2dDZTJpbUg0MUloV01GUzhNTkUwOUpUCkVQNjhXZlFYMEtFaWN5WFlaenA0RnplTTZVRHh3Q0RhaDV3Mk9JM2N3djc1RVhHUHdDd1ZmU0llcVRRY1MwRVgKWFZiY2UwSEVuUC9LaCtENFAzODgwaCtXZ3R2aXhRNXFJTHNlZC9qSytxdkxCMGx5Q3U2a1c1bGRyMTJRYkQrTQpjeERZcFgwZUsxMTIyc3JhZmRoaGhBRmxlOXFIVjRFMGROTU9ZMk1EVEhLU25HbjB1bVh5cnUwQzNoaDU0VkYwCmk4MThkeTRKUVNMekpEcGlBVVNzVnB3bzJVUjRJaUxYbTVMOEgrOEN2VkgyLzFWSmo5c2o1czQ9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0="
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "ingress-nginx",
                name: "ingress-nginx",
                chart: "ingress-nginx",
                repository: "https://kubernetes.github.io/ingress-nginx",
                version: "4.3.0",
                values: {
                    controller: {
                        image: {
                            registry: "registry.cn-hangzhou.aliyuncs.com",
                            image: "goldstrike/skywalking-ingress-nginx",
                            tag: "v1.4.0",
                            digest: "sha256:df21be8362aebe14a5c1c5c76cfe9b1628dee75197984dd12e8fd4478943b3c8"
                        },
                        config: {
                            "compute-full-forwarded-for": "true",
                            "enable-brotli": "true",
                            "enable-modsecurity": "false",
                            "enable-owasp-modsecurity-crs": "false",
                            "force-ssl-redirect": "true",
                            "forwarded-for-header": "X-Forwarded-For",
                            "keep-alive": "60",
                            "keep-alive-requests": "2048",
                            "max-worker-connections": "20480",
                            "real_ip_header": "X-Forwarded-For",
                            "ssl_ciphers": "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384",
                            "ssl_protocols": "TLSv1.2 TLSv1.3",
                            "upstream-keepalive-connections": "8192",
                            "upstream-keepalive-requests": "256",
                            "upstream-keepalive-timeout": "60",
                            "use-geoip": "false",
                            "use-gzip": "false",
                            "use-http2": "true",
                            "worker-cpu-affinity": "auto",
                        },
                        configAnnotations: { "nginx.ingress.kubernetes.io/auth-tls-secret": "ingress-nginx/internal-ca" },
                        addHeaders: {
                            "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
                            "X-Frame-Options": "DENY",
                            "X-Content-Type-Options": "nosniff",
                            "X-XSS-Protection": "1; mode=block"
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                        sysctls: {
                            "net.core.somaxconn": "8192",
                            "net.ipv4.ip_local_port_range": "1024 65000"
                        },
                        extraEnvs: [
                            { name: "SW_SERVICE_NAME", value: "ingress-nginx" },
                            { name: "SW_BACKEND_SERVERS", value: "http://skywalking-oap.skywalking.svc.cluster.local:12800" },
                            { name: "SW_SERVICE_INSTANCE_NAME", valueFrom: { fieldRef: { fieldPath: "metadata.name" } } }
                        ],
                        extraArgs: { "default-ssl-certificate": "ingress-nginx/default-tls-secret" },
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        },
                        service: {
                            annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
                        },
                        admissionWebhooks: {
                            patch: {
                                image: {
                                    registry: "registry.cn-hangzhou.aliyuncs.com",
                                    image: "google_containers/kube-webhook-certgen",
                                    digest: "sha256:cb080cc0a142137398ee9a55268bd36b2e4ca9941203191ec5846ee565b959e8"
                                }
                            }
                        },
                        metrics: {
                            enabled: true,
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
                            prometheusRule: {
                                enabled: false
                            }
                        }
                    },
                    defaultBackend: {
                        enabled: true,
                        image: {
                            registry: "registry.cn-hangzhou.aliyuncs.com",
                            image: "goldstrike/defaultbackend-amd64",
                            digest: "sha256:4dc5e07c8ca4e23bddb3153737d7b8c556e5fb2f29c4558b7cd6e6df99c512c7"
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        }
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
    // Create Kubernetes Secret.
    for (var secret_index in deploy_spec[i].secret) {
        const secret = new k8s.core.v1.Secret(deploy_spec[i].secret[secret_index].metadata.name, {
            metadata: deploy_spec[i].secret[secret_index].metadata,
            type: deploy_spec[i].secret[secret_index].type,
            data: deploy_spec[i].secret[secret_index].data,
            stringData: deploy_spec[i].secret[secret_index].stringData
        }, { dependsOn: [namespace] });
    }
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