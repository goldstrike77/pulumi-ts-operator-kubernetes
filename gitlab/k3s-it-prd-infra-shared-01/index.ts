import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "gitlab",
                    annotations: {},
                    labels: {}
                },
                spec: {}
            }
        ],
        secret: [
            {
                metadata: {
                    name: "gitlab-tls-chain",
                    namespace: "gitlab",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "gitlab.home.local.crt": btoa(`-----BEGIN CERTIFICATE-----
MIIDRDCCAiwCCQCLL4t71Jt1ojANBgkqhkiG9w0BAQsFADBkMQswCQYDVQQGEwJY
WDENMAsGA1UECAwETWFyczEWMBQGA1UEBwwNTW91bnQgT2x5bXB1czEQMA4GA1UE
CgwHQ29tcGFueTENMAsGA1UECwwEVW5pdDENMAsGA1UEAwwEUk9PVDAeFw0yMDA2
MTEwOTE2MzlaFw00MDA2MTEwOTE2MzlaMGQxCzAJBgNVBAYTAlhYMQ0wCwYDVQQI
DARNYXJzMRYwFAYDVQQHDA1Nb3VudCBPbHltcHVzMRAwDgYDVQQKDAdDb21wYW55
MQ0wCwYDVQQLDARVbml0MQ0wCwYDVQQDDARST09UMIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEA0gpK3LDFYKib5XZs0IlEL/Mzx4WdLhhHCPeiYNNKkxKn
VaUKE+M/B1K+hTZmYLfG5VAOZgkdpWr7pfmPSN9qWyKNqderAHzQu8A4YbxbSSQV
DKVcpQCaHEfjcEKjl0zDIX1MKzJiArJ4YPTCixgDlni195BmDBw100YGa3jw+DxS
LLlR8TA7yeLu/0NmDU31/3u5fAVZ+Vqsnlvn+rJ87Zzdkkq4EPPXojpbDIol+TL1
BIW+KNLMwZ4g8AGmdzfRP+ztmNqnK/M7j+KhK7XI2YpvkdhSCXmdx/gUs5S8xmhP
XKcSLFYhWsxj3wo9ZXsmwAjfQaS6Zfy4+F7junBlDQIDAQABMA0GCSqGSIb3DQEB
CwUAA4IBAQBDrF/ceHWzXwobHoPLLwi+mJxGsS6ROU3Qs2siLdBz374NMfA2Stke
Mj4uOTvcvgzl/yMMVLg/sQXLyo/gEa9Ya4XdX4qNiDcCp3x6J3gmkl0kqO687yQJ
EumEWUWrfxgjxtHR1C/cTEgqc6F0RWGsV+23dOBoLoQBkv4cTldyj0FLDIdIHwjw
AW3Py12YobJ54lv8jlfaUEf5x7gwyMny04uh4hM5MGMVGof+wQZuM4bY30dV526y
AOqx13cHJzMBEmxhWQ5gdP3c9wJqUnI+002ON7bZr9mUtCEZoBSu41oT8lhc4m4d
YB2cjNpMuRLjcS6Ge5rABpyAFYoTThXv
-----END CERTIFICATE-----`)
                },
                stringData: {}
            },
            {
                metadata: {
                    name: "gitlab-secret",
                    namespace: "gitlab",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "root-password": Buffer.from(config.require("ROOT-PASSWORD")).toString('base64'),
                    "psql-password": Buffer.from(config.require("PSQL-PASSWORD")).toString('base64'),
                    "storage-config": btoa(`[default]
access_key = ${config.require("AWS_ACCESS_KEY")}
secret_key = ${config.require("AWS_SECRET_KEY")}
bucket_location = us-east-1
multipart_chunk_size_mb = 128
`),
                    "rails-s3": btoa(`provider: AWS
region: us-east-1
aws_access_key_id: ${config.require("AWS_ACCESS_KEY")}
aws_secret_access_key: ${config.require("AWS_SECRET_KEY")}
endpoint: "http://minio.mino:9000"
`),
                    "registry-s3": btoa(`s3:
  bucket: gitlab-registry-storage
  accesskey: ${config.require("AWS_ACCESS_KEY")}
  secretkey: ${config.require("AWS_SECRET_KEY")}
  region: us-east-1
  regionendpoint: "http://minio.mino:9000"
  v4auth: true
`),
                },
                stringData: {}
            }
        ],
        release: [
            {
                namespace: "gitlab",
                name: "gitlab",
                //chart: "gitlab",
                //repositoryOpts: {
                //    repo: "https://charts.gitlab.io"
                //},
                chart: "../../_chart/gitlab-8.4.0.tgz",
                repository: "",
                version: "8.4.0",
                values: {
                    global: {
                        edition: "ce",
                        hosts: {
                            domain: "home.local"
                        },
                        communityImages: {
                            migrations: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/gitlab-toolbox-ce"
                            },
                            sidekiq: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/gitlab-sidekiq-ce"
                            },
                            toolbox: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/gitlab-toolbox-ce"
                            },
                            webservice: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/gitlab-webservice-ce"
                            },
                            workhorse: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/gitlab-workhorse-ce"
                            }
                        },
                        ingress: {
                            configureCertmanager: false,
                            class: "traefik",
                            tls: { enabled: false }
                        },
                        initialRootPassword: {
                            secret: "gitlab-secret",
                            key: "root-password"
                        },
                        psql: {
                            password: {
                                secret: "gitlab-secret",
                                key: "psql-password"
                            },
                            host: "postgresql",
                            username: "gitlab",
                            database: "gitlab"
                        },
                        redis: {
                            auth: {
                                enabled: false
                            },
                            host: "redis-master"
                        },
                        minio: { "enabled": false },
                        appConfig: {
                            lfs: {
                                enabled: true,
                                bucket: "gitlab-lfs-storage",
                                connection: {
                                    secret: "gitlab-secret",
                                    key: "rails-s3"
                                }
                            },
                            artifacts: {
                                enabled: true,
                                bucket: "gitlab-artifacts-storage",
                                connection: {
                                    secret: "gitlab-secret",
                                    key: "rails-s3"
                                }
                            },
                            uploads: {
                                enabled: true,
                                bucket: "gitlab-uploads-storage",
                                connection: {
                                    secret: "gitlab-secret",
                                    key: "rails-s3"
                                }
                            },
                            packages: {
                                enabled: true,
                                bucket: "gitlab-packages-storage",
                                connection: {
                                    secret: "gitlab-secret",
                                    key: "rails-s3"
                                }
                            },
                            externalDiffs: {
                                enabled: true,
                                bucket: "gitlab-externaldiffs-storage",
                                connection: {
                                    secret: "gitlab-secret",
                                    key: "rails-s3"
                                }
                            },
                            terraformState: {
                                enabled: true,
                                bucket: "gitlab-terraform-state",
                                connection: {
                                    secret: "gitlab-secret",
                                    key: "rails-s3"
                                }
                            },
                            ciSecureFiles: {
                                enabled: true,
                                bucket: "gitlab-ci-secure-files",
                                connection: {
                                    secret: "gitlab-secret",
                                    key: "rails-s3"
                                }
                            },
                            dependencyProxy: {
                                enabled: true,
                                bucket: "gitlab-dependencyproxy-storage",
                                connection: {
                                    secret: "gitlab-secret",
                                    key: "rails-s3"
                                }
                            },
                            backups: {
                                bucket: "gitlab-backups-storage",
                                tmpBucket: "gitlab-tmp-storage"
                            }
                        },
                        time_zone: "PRC",
                        certificates: {
                            image: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/certificates",
                                tag: "v17.4.0"
                            }
                        },
                        kubectl: {
                            image: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/kubectl",
                                tag: "v17.4.0"
                            }
                        },
                        gitlabBase: {
                            image: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/gitlab-base",
                                tag: "v17.4.0"
                            }
                        }
                    },
                    "gitlab-runner": {
                        install: true,
                        certsSecretName: "gitlab-tls-chain",
                        runners: {
                            config: `[[runners]]
  [runners.kubernetes]
  image = "swr.cn-east-3.myhuaweicloud.com/docker-io/ubuntu:22.04"
  [runners.cache]
    Type = "s3"
    Shared = true
    [runners.cache.s3]
      AccessKey = "${config.require('AWS_ACCESS_KEY')}"
      SecretKey = "${config.require('AWS_SECRET_KEY')}"
      BucketLocation = "us-east-1"
      BucketName = "gitlab-runner-cache"
      Insecure = true
      ServerAddress = "http://minio.mino:9000"`
                        },
                        image: {
                            registry: "ccr.ccs.tencentyun.com",
                            repository: "gitlab-org/gitlab-runner",
                            tag: "alpine-v17.3.1"
                        }
                    },
                    gitlab: {
                        toolbox: {
                            replicas: 1,
                            backups: {
                                objectStorage: {
                                    config: {
                                        secret: "gitlab-secret",
                                        key: "storage-config"
                                    }
                                }
                            }
                        },
                        webservice: {
                            minReplicas: 1
                        },
                        "gitlab-exporter": {
                            enabled: false,
                            image: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/gitlab-exporter",
                                tag: "15.0.0"
                            }
                        },
                        gitaly: {
                            image: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/gitaly",
                                tag: "v17.4.0"
                            }
                        },
                        "gitlab-shell": {
                            minReplicas: 1,
                            image: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/gitlab-shell",
                                tag: "v14.39.0"
                            }
                        },
                        kas: {
                            minReplicas: 1,
                            image: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/kas",
                                tag: "v17.4.0"
                            }
                        }
                    },
                    certmanager: { install: false },
                    "nginx-ingress": { "enabled": false },
                    prometheus: { "install": false },
                    redis: { "install": false },
                    postgresql: { "install": false },
                    registry: {
                        enabled: true,
                        hpa: {
                            minReplicas: 1,
                            maxReplicas: 1
                        },
                        bucket: "gitlab-registry-storage",
                        storage: {
                            secret: "gitlab-secret",
                            key: "registry-s3"
                        },
                        image: {
                            repository: "ccr.ccs.tencentyun.com/gitlab-org/gitlab-container-registry",
                            tag: "v4.9.0-gitlab"
                        }
                    },
                    "shared-secrets": {
                        enabled: true,
                        selfsign: {
                            image: {
                                repository: "ccr.ccs.tencentyun.com/gitlab-org/cfssl-self-sign",
                                tag: "v17.4.0"
                            }
                        }
                    },
                    traefik: { "install": false },
                    "gitlab-zoekt": { "install": false }
                }
            },
            {
                namespace: "gitlab",
                name: "redis",
                chart: "redis",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "20.0.5",
                values: {
                    global: {
                        imageRegistry: "swr.cn-east-3.myhuaweicloud.com"
                    },
                    image: {
                        repository: "docker-io/redis",
                        tag: "6.2.14-debian-12-r26"
                    },
                    architecture: "standalone",
                    auth: {
                        enabled: false
                    },
                    commonConfiguration: `appendonly no
maxmemory 192mb
tcp-keepalive 300
tcp-backlog 128
maxclients 1000
save ""
`,
                    master: {
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        persistence: { enabled: false }
                    }
                }
            },
            {
                namespace: "gitlab",
                name: "postgresql",
                chart: "postgresql",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "15.5.34",
                values: {
                    global: {
                        imageRegistry: "swr.cn-east-3.myhuaweicloud.com",
                        defaultStorageClass: "local-path"
                    },
                    image: {
                        repository: "docker-io/postgresql",
                        tag: "16.4.0-debian-12-r11"
                    },
                    auth: {
                        enablePostgresUser: true,
                        postgresPassword: config.require("PSQL-PASSWORD"),
                        username: "gitlab",
                        password: config.require("PSQL-PASSWORD"),
                        database: "gitlab"
                    },
                    architecture: "standalone",
                    shmVolume: {
                        enabled: true,
                        sizeLimit: "1Gi"
                    },
                    primary: {
                        name: "primary",
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        },
                        persistence: { size: "7Gi" }
                    },

                }
            },
            /**
            {
                namespace: "gitlab",
                name: "cert-manager",
                chart: "cert-manager",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "1.3.18",
                values: {
                    global: {
                        imageRegistry: "swr.cn-east-3.myhuaweicloud.com"
                    },
                    logLevel: 2,
                    replicaCount: 1,
                    installCRDs: true,
                    controller: {
                        image: {
                            repository: "docker-io/cert-manager"
                        },
                        acmesolver: {
                            image: {
                                repository: "docker-io/acmesolver"
                            }
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    webhook: {
                        image: {
                            repository: "docker-io/cert-manager-webhook"
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    cainjector: {
                        image: {
                            repository: "docker-io/cainjector"
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    metrics: { enabled: false }
                }
            }
                 */
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [secret] });