import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "minio",
                    annotations: {},
                    labels: {}
                },
                spec: {}
            }
        ],
        release: [
            {
                namespace: "minio",
                name: "minio",
                chart: "minio",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "14.7.1",
                values: {
                    global: {
                        imageRegistry: "swr.cn-east-3.myhuaweicloud.com"
                    },
                    image: {
                        repository: "docker-io/minio",
                        tag: "2024.8.17-debian-12-r0"
                    },
                    resources: {
                        limits: { cpu: "1000m", memory: "3072Mi" },
                        requests: { cpu: "1000m", memory: "3072Mi" }
                    },
                    clientImage: {
                        repository: "docker-io/minio-client",
                        tag: "2024.8.13-debian-12-r0"
                    },
                    mode: "standalone",
                    auth: {
                        rootUser: "admin",
                        rootPassword: config.require("rootPassword")
                    },
                    ingress: {
                        enabled: true,
                        ingressClassName: "traefik",
                        hostname: "minio-console.home.local",
                        annotations: {
                            "ingress.kubernetes.io/proxy-body-size": "0",
                            "nginx.ingress.kubernetes.io/proxy-body-size": "0"
                        }
                    },
                    apiIngress: {
                        enabled: true,
                        ingressClassName: "traefik",
                        hostname: "minio.home.local",
                        annotations: {
                            "ingress.kubernetes.io/proxy-body-size": "0",
                            "nginx.ingress.kubernetes.io/proxy-body-size": "0"
                        }
                    },
                    persistence: {
                        storageClass: "local-path",
                        size: "127Gi"
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });