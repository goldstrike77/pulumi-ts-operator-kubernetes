import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

const podlabels = {
    customer: "it",
    environment: "prd",
    project: "Container-Registry",
    group: "Harbor",
    datacenter: "cn-north",
    domain: "local"
}

let config = new pulumi.Config();

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "harbor",
                    annotations: {},
                    labels: {}
                },
                spec: {}
            }
        ],
        release: [
            {
                namespace: "harbor",
                name: "harbor",
                chart: "harbor",
                repositoryOpts: {
                    repo: "https://helm.goharbor.io"
                },
                version: "1.15.1",
                values: {
                    expose: {
                        type: "ingress",
                        tls: { enabled: false },
                        ingress: {
                            hosts: {
                                core: "harbor.home.local"
                            },
                            className: "traefik"
                        }
                    },
                    externalURL: "https://harbor.home.local",
                    persistence: {
                        enabled: true,
                        imageChartStorage: {
                            disableredirect: true,
                            type: "s3",
                            s3: {
                                region: "us-east-1",
                                bucket: "harbor",
                                accesskey: config.require("AWS_ACCESS_KEY_ID"),
                                secretkey: config.require("AWS_SECRET_ACCESS_KEY"),
                                regionendpoint: "http://minio.minio:9000",
                                encrypt: false,
                                secure: false,
                                skipverify: true
                            }
                        }
                    },
                    harborAdminPassword: config.require("HARBOR_ADMIN_PASSWORD"),
                    internalTLS: {
                        enabled: false,
                        strong_ssl_ciphers: true
                    },
                    ipFamily: {
                        ipv6: { enabled: false }
                    },
                    logLevel: "warning",
                    secretKey: "not-a-secure-key",
                    metrics: { enabled: false },
                    cache: {
                        enabled: true,
                        expireHours: 24
                    },
                    portal: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-portal",
                        },
                        replicas: 1,
                        podLabels: podlabels
                    },
                    core: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-core",
                        },
                        replicas: 1,
                        podLabels: podlabels
                    },
                    jobservice: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-jobservice",
                        },
                        replicas: 1,
                        podLabels: podlabels
                    },
                    registry: {
                        registry: {
                            image: {
                                repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/registry-photon",
                            }
                        },
                        controller: {
                            image: {
                                repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-registryctl",
                            }
                        },
                        replicas: 1,
                        podLabels: podlabels
                    },
                    trivy: {
                        enabled: true,
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/trivy-adapter-photon",
                        },
                        replicas: 1,
                        podLabels: podlabels
                    },
                    database: {
                        type: "internal",
                        internal: {
                            image: {
                                repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-db"
                            }
                        }
                    },
                    redis: {
                        type: "internal",
                        internal: {
                            image: {
                                repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/redis-photon"
                            }
                        }
                    },
                    exporter: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-exporter",
                        },
                        replicas: 1,
                        podLabels: podlabels
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });