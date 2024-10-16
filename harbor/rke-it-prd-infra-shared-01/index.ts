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
                    labels: {
                        "pod-security.kubernetes.io/enforce": "privileged",
                        "pod-security.kubernetes.io/audit": "privileged",
                        "pod-security.kubernetes.io/warn": "privileged"
                    }
                },
                spec: {}
            }
        ],
        secret: [
            {
                metadata: {
                    name: "harbor-cert",
                    namespace: "harbor",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "tls.key": "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBbi82Z05kZ0xUdjlyMUNpVTNWdUxKZ3M5cm5CUjNJUUNYc3NDZWprRTFRcStiTG0zCngydEJ6eWphVGRnb2NZZ000KzMyNkk3dGtXdnByYm1aUnhrZVozUy9aZ2xwQ1BGWXM2aVBEYzVtdDFEb2RMR2UKeGxuT1RlTXQxeWw5MHdSaTZ5aWlxbkRnYmM3NTJ4NTlYa2NKeDdKalhHR0tMeGpCSmtpSWlqT0sveXIxclBHQwppRVk4ZWZKUFpYN1RMVFBhZWU5VmVGYUxDQm1mcXlNb0FSQkZPVmZSeGlSbHZaMmk0NlFpdDZKV0Q0MStJakdKClVVcXN2N2l1bzdzbTVUOVFzRVYzR01NSFdsdnhYcFlMcGkvZlZBLzArYWZGN0tUMWdXUngrWWJveHVBalRIZncKMHlpeHFJY3lqRjdKbjRjMlNjbExjS1MzMjNKNHhrZDdVYVdxandJREFRQUJBb0lCQUd2K3hvdXh1ZWhuOXBQdApsSlphTFhIUGtxSUZoT3d4V3h3N01mL29Mdi9TMGJpNEgzb0hSeE9iUXNmYXlXbmc2THFOck9WTFhNYVZMZFdxCit2Q0gzd0w4UmhtTTdvNHZ3cXo2Y1Ixam5lZk5RQ3RNblp6TGo3cjVScjcrYmNVYko5NE52c2NIakNYeTJLcDAKU1RGekNBSDR3cUxmNEJOc1JTd2ZON0w1bWJBa2NScWxMN1FiK0NPRGdmcTJWSHkvVEQ2UjlWSDNSNXdzRUxkZwpDb3l4TVE3dTRlWjd0RGh3L3pucFRDYjBzYUZiQ3NsZmpDN3FqRmxtZkVzbWpBYWdzU0MzdkRlZkg1elNITG1uCktzR2tocjhrejlvNjRuUWdXVVkyWXVUdXJMdjErL3pQOFY0cU42Z0pSdnZoZi9NdlVLaGpwaXcwT01HdmlJQ20KWmNyaXltRUNnWUVBeXRac29RK2ZPSTg3cXU4UG4xS3BCdGFUNTFNME4vMUdaVkxvT0grcjNmZElNMXU4MlRpSApBVDY0RXU2ZnZnZEhmZFE3dFNxZzRlczROazlTdlpLcXRhME1tN1Z4UnlXVUJISW93MHdvTXRvWU1wUS83OGVTCkVLWmw2Zk43V3pVMEdlUkVwU3lIY2dYaXE5bjZzdHJmWFkvdnFwM20xcTZiQTdvMVNOSG9FeEVDZ1lFQXllMmQKQkMrVTZ2cFN0Q1RudWp2QTlWMldlRkF5a2l1UWFXYnVQYUd5WVFUWXFwUHNQRFp5akdhUVpTRnN5ekJ2NitXcQpNZTdCcVlVMWpDRVNmQitpSHA1UWxZZm9uR3puclBlRDhxNlBLQy94WTB4RXN4ay9EV1ZnRHlqNDVFNk9UeVhCCkd1eHoyelk4S0VUdXdoNGNGMWZZWmVzSEM0VHVDWHVndkF4K281OENnWUVBb0RkYXVxV1NTS1NxcHN3SjlQamYKMWl6cnlzNm44b20yYnhaYm96VUZWbUNhd1NaM05zVTFya0FTT2JJT3I1VWtYVG1rcCtjeUNRRTQ5MzBVaC9VdgpyaTB3UmxXOVVrdFdiV1NXMmh4dnJDc2s3ZDYzMmZnelliOXR4S3UwQmtreUREbUlGMGZpL0tlMWNiVE9GelJYCk5wb1kzeFcyWG1Dd3hQTHlYOENkcFdFQ2dZQlFtVzZXRUNRQjB0OFdGckVFRGZ2TU5JbnVCaHpaYVZnZ0tqeW8KRHhXelVncmxzMXVWQVNxaHpnS095MU93bXVuaG4rOWFOUEhLSjJpalFVUXVsVFhSd09GcmZpOGoyUGgwZXV1SQovNUlXdVdSQmZWemluQTRsMjdRRytSUzNsSCtMS2dlMUpuSnNLbTdDcUJraEZJR2o4NlZsc1BWRDdOQlNxcTBTCndtMytBd0tCZ1FDSmtETVdhNlp6ZmVxN0Z1bHB3UmNUKzQvd1RtaFdYWjVURmNlZEZhSUtpTHlweWZnVjNWcTAKN0VuZjBTOXRpWmM2V3hWRmpkeUVhdVIzZCt6a3ZKUkFxVm5sRnRCTjFjZmpSTkUzNmRiY3diUFY5S0orZEhEcgphdmw1YzA3QXBhcWJ2eUIyUXRVeWMrVEg2bDBKSWRnenVJY2JiODNubXE1S0EvcTBrUEdzREE9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQ==",
                    "tls.crt": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURrRENDQW5pZ0F3SUJBZ0lVTndYQW1vVS9qSnFjRjl5bGlzTTZrSXpNYjZ3d0RRWUpLb1pJaHZjTkFRRUwKQlFBd1pERUxNQWtHQTFVRUJoTUNXRmd4RFRBTEJnTlZCQWdNQkUxaGNuTXhGakFVQmdOVkJBY01EVTF2ZFc1MApJRTlzZVcxd2RYTXhFREFPQmdOVkJBb01CME52YlhCaGJua3hEVEFMQmdOVkJBc01CRlZ1YVhReERUQUxCZ05WCkJBTU1CRkpQVDFRd0hoY05NalF3TlRFd01EZ3lPRFV3V2hjTk16UXdOVEE0TURneU9EVXdXakJiTVFzd0NRWUQKVlFRR0V3SkRUakVWTUJNR0ExVUVCd3dNUkdWbVlYVnNkQ0JEYVhSNU1Sd3dHZ1lEVlFRS0RCTkVaV1poZFd4MApJRU52YlhCaGJua2dUSFJrTVJjd0ZRWURWUVFEREE1dlluTXVhRzl0WlM1c2IyTmhiRENDQVNJd0RRWUpLb1pJCmh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBSi8rb0RYWUMwNy9hOVFvbE4xYml5WUxQYTV3VWR5RUFsN0wKQW5vNUJOVUt2bXk1dDhkclFjOG8yazNZS0hHSURPUHQ5dWlPN1pGcjZhMjVtVWNaSG1kMHYyWUphUWp4V0xPbwpqdzNPWnJkUTZIU3huc1paemszakxkY3BmZE1FWXVzb29xcHc0RzNPK2RzZWZWNUhDY2V5WTF4aGlpOFl3U1pJCmlJb3ppdjhxOWF6eGdvaEdQSG55VDJWKzB5MHoybm52VlhoV2l3Z1puNnNqS0FFUVJUbFgwY1lrWmIyZG91T2sKSXJlaVZnK05maUl4aVZGS3JMKzRycU83SnVVL1VMQkZkeGpEQjFwYjhWNldDNll2MzFRUDlQbW54ZXlrOVlGawpjZm1HNk1iZ0kweDM4Tk1vc2FpSE1veGV5WitITmtuSlMzQ2t0OXR5ZU1aSGUxR2xxbzhDQXdFQUFhTkRNRUV3Ckp3WURWUjBSQkNBd0hvSU9iMkp6TG1odmJXVXViRzlqWVd5Q0RDb3VhRzl0WlM1c2IyTmhiREFKQmdOVkhSTUUKQWpBQU1Bc0dBMVVkRHdRRUF3SUY0REFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBdFF2ZDV2RjNVY1cyUXVTdQoweUVjN3BHK01pcDM5WkowMHBpMnNNbmMvUENIWklaS2VIaWl5M1l2K01DRVhTTWFaTHUyRndRNTFRWldudU42CmNSTjF4ejA5ZFBPTDdnaWoyWVRJYVBzbkZ3Q0M1elRXMlV4eENWeGZHTW00OGd0RnZsOExHd3l2NWFwUW0ySWwKZnJsUlVwTGp6QTgzZlgzbWg1Q0JiNUZJMzNYc1BueTlPekFBM2NhOXlXWUZKSzJNRVNyYzZ3UjZpa2Z4MjN5eApOekJrNnRwdXFMbEdQMU9oV1JWZC9CYmxsbHJ1TWRreHROamphNm4yUjdpOEQ3UkhsdXpieGVxQTdwamk5c09XCnNwVXNLR3ozbG04UU1ZWTVSL0FnNUpEYU1tQW0ybW9jUFRsdTRXUUhBV2NtLzFYcFdmbkNhc003Z0pCdlI3NTEKbkNjOE1BPT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQotLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS0KTUlJRFJEQ0NBaXdDQ1FDTEw0dDcxSnQxb2pBTkJna3Foa2lHOXcwQkFRc0ZBREJrTVFzd0NRWURWUVFHRXdKWQpXREVOTUFzR0ExVUVDQXdFVFdGeWN6RVdNQlFHQTFVRUJ3d05UVzkxYm5RZ1QyeDViWEIxY3pFUU1BNEdBMVVFCkNnd0hRMjl0Y0dGdWVURU5NQXNHQTFVRUN3d0VWVzVwZERFTk1Bc0dBMVVFQXd3RVVrOVBWREFlRncweU1EQTIKTVRFd09URTJNemxhRncwME1EQTJNVEV3T1RFMk16bGFNR1F4Q3pBSkJnTlZCQVlUQWxoWU1RMHdDd1lEVlFRSQpEQVJOWVhKek1SWXdGQVlEVlFRSERBMU5iM1Z1ZENCUGJIbHRjSFZ6TVJBd0RnWURWUVFLREFkRGIyMXdZVzU1Ck1RMHdDd1lEVlFRTERBUlZibWwwTVEwd0N3WURWUVFEREFSU1QwOVVNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUYKQUFPQ0FROEFNSUlCQ2dLQ0FRRUEwZ3BLM0xERllLaWI1WFpzMElsRUwvTXp4NFdkTGhoSENQZWlZTk5La3hLbgpWYVVLRStNL0IxSytoVFptWUxmRzVWQU9aZ2tkcFdyN3BmbVBTTjlxV3lLTnFkZXJBSHpRdThBNFlieGJTU1FWCkRLVmNwUUNhSEVmamNFS2psMHpESVgxTUt6SmlBcko0WVBUQ2l4Z0RsbmkxOTVCbURCdzEwMFlHYTNqdytEeFMKTExsUjhUQTd5ZUx1LzBObURVMzEvM3U1ZkFWWitWcXNubHZuK3JKODdaemRra3E0RVBQWG9qcGJESW9sK1RMMQpCSVcrS05MTXdaNGc4QUdtZHpmUlArenRtTnFuSy9NN2orS2hLN1hJMllwdmtkaFNDWG1keC9nVXM1Uzh4bWhQClhLY1NMRlloV3N4ajN3bzlaWHNtd0FqZlFhUzZaZnk0K0Y3anVuQmxEUUlEQVFBQk1BMEdDU3FHU0liM0RRRUIKQ3dVQUE0SUJBUUJEckYvY2VIV3pYd29iSG9QTEx3aSttSnhHc1M2Uk9VM1FzMnNpTGRCejM3NE5NZkEyU3RrZQpNajR1T1R2Y3ZnemwveU1NVkxnL3NRWEx5by9nRWE5WWE0WGRYNHFOaURjQ3AzeDZKM2dta2wwa3FPNjg3eVFKCkV1bUVXVVdyZnhnanh0SFIxQy9jVEVncWM2RjBSV0dzVisyM2RPQm9Mb1FCa3Y0Y1RsZHlqMEZMRElkSUh3ancKQVczUHkxMllvYko1NGx2OGpsZmFVRWY1eDdnd3lNbnkwNHVoNGhNNU1HTVZHb2Yrd1FadU00YlkzMGRWNTI2eQpBT3F4MTNjSEp6TUJFbXhoV1E1Z2RQM2M5d0pxVW5JKzAwMk9ON2JacjltVXRDRVpvQlN1NDFvVDhsaGM0bTRkCllCMmNqTnBNdVJMamNTNkdlNXJBQnB5QUZZb1RUaFh2Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0="
                },
                stringData: {}
            }
        ],
        configmap: [
            {
                metadata: {
                    name: "redis-external-config",
                    namespace: "harbor",
                    annotations: {},
                    labels: {}
                },
                data: {
                    "redis-additional.conf": `maxmemory 128mb
tcp-keepalive 60
tcp-backlog 8192
maxclients 1000
databases 10
save ""`
                }
            }
        ],
        customresource: [
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "harbor-redis",
                    namespace: "harbor"
                },
                spec: {
                    podMetricsEndpoints: [
                        {
                            interval: "60s",
                            scrapeTimeout: "30s",
                            scheme: "http",
                            targetPort: "redis-exporter",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { action: "replace", replacement: "it", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "prd", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "Container-Registry", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "Harbor", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "cn-north", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["harbor"]
                    },
                    selector: {
                        matchLabels: { app: "harbor-redis" }
                    }
                }
            },
            {
                apiVersion: "redis.redis.opstreelabs.in/v1beta2",
                kind: "Redis",
                metadata: {
                    name: "harbor-redis",
                    namespace: "harbor"
                },
                spec: {
                    kubernetesConfig: {
                        image: "quay.io/opstree/redis:v7.0.12",
                        imagePullPolicy: "IfNotPresent",
                        resources: {
                            limits: { cpu: "200m", memory: "192Mi" },
                            requests: { cpu: "200m", memory: "192Mi" }
                        }
                    },
                    redisExporter: {
                        enabled: true,
                        image: "quay.io/opstree/redis-exporter:v1.44.0",
                        imagePullPolicy: "IfNotPresent",
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    },
                    redisConfig: {
                        additionalRedisConfig: "redis-external-config"
                    },
                    podSecurityContext: {
                        runAsUser: 1000,
                        fsGroup: 1000
                    }
                }
            },
            {
                kind: "postgresql",
                apiVersion: "acid.zalan.do/v1",
                metadata: {
                    name: "harbor-postgres",
                    namespace: "harbor",
                    labels: podlabels
                },
                spec: {
                    teamId: "infra",
                    postgresql: {
                        parameters: {
                            checkpoint_completion_target: "0.9",
                            default_statistics_target: "100",
                            effective_cache_size: "768MB",
                            effective_io_concurrency: "200",
                            huge_pages: "655kB",
                            maintenance_work_mem: "64MB",
                            max_connections: "200",
                            max_parallel_workers: "1",
                            max_wal_size: "4GB",
                            max_worker_processes: "1",
                            min_wal_size: "1GB",
                            random_page_cost: "1.1",
                            shared_buffers: "256MB",
                            synchronous_commit: "on",
                            wal_buffers: "7864kB",
                            wal_keep_size: "256",
                            work_mem: "327kB"
                        },
                        version: "13"
                    },
                    numberOfInstances: 1,
                    volume: {
                        size: "15Gi",
                        storageClass: "vsphere-san-sc"
                    },
                    users: { harbor: [] },
                    databases: { harbor: "harbor" },
                    allowedSourceRanges: null,
                    resources: {
                        requests: { cpu: "1000m", memory: "1024Mi" },
                        limits: { cpu: "1000m", memory: "1024Mi" }
                    },
                    enableLogicalBackup: true
                }
            },
        ],
        release: [
            {
                namespace: "harbor",
                name: "harbor",
                chart: "harbor",
                repositoryOpts: {
                    repo: "https://helm.goharbor.io"
                },
                version: "1.15.0",
                values: {
                    expose: {
                        type: "loadBalancer",
                        tls: {
                            enabled: true,
                            certSource: "secret",
                            secret: {
                                secretName: "harbor-cert"
                            }
                        },
                        loadBalancer: {
                            IP: "192.168.0.109"
                        }
                    },
                    externalURL: "https://harbor.home.local",
                    persistence: {
                        enabled: true,
                        resourcePolicy: "",
                        persistentVolumeClaim: {
                            registry: { storageClass: "vsphere-san-sc", size: "5Gi" },
                            jobservice: { jobLog: { storageClass: "vsphere-san-sc", size: "1Gi" } },
                            trivy: { storageClass: "vsphere-san-sc", size: "5Gi" }
                        },
                        imageChartStorage: {
                            type: "s3",
                            s3: {
                                region: "us-east-1",
                                bucket: "harbor",
                                accesskey: config.require("AWS_ACCESS_KEY_ID"),
                                secretkey: config.require("AWS_SECRET_ACCESS_KEY"),
                                regionendpoint: "http://obs.home.local:9000",
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
                    logLevel: "warning",
                    secretKey: "not-a-secure-key",
                    metrics: {
                        enabled: true,
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
                            relabelings: []
                        }
                    },
                    cache: {
                        enabled: true,
                        expireHours: 24
                    },
                    nginx: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/nginx-photon",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        },
                        podLabels: podlabels
                    },
                    portal: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-portal",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "256Mi" },
                            requests: { cpu: "100m", memory: "256Mi" }
                        },
                        podLabels: podlabels
                    },
                    core: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-core",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        },
                        podLabels: podlabels
                    },
                    jobservice: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-jobservice",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "300m", memory: "256Mi" },
                            requests: { cpu: "300m", memory: "256Mi" }
                        },
                        podLabels: podlabels
                    },
                    registry: {
                        registry: {
                            image: {
                                repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/registry-photon",
                                tag: "v2.11.0"
                            },
                            resources: {
                                limits: { cpu: "2000m", memory: "512Mi" },
                                requests: { cpu: "1000m", memory: "512Mi" }
                            },
                        },
                        controller: {
                            image: {
                                repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-registryctl",
                                tag: "v2.11.0"
                            },
                            resources: {
                                limits: { cpu: "100m", memory: "256Mi" },
                                requests: { cpu: "100m", memory: "256Mi" }
                            },
                        },
                        replicas: 1,
                        podLabels: podlabels
                    },
                    trivy: {
                        enabled: true,
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/trivy-adapter-photon",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "1000m", memory: "1024Mi" },
                            requests: { cpu: "1000m", memory: "1024Mi" }
                        },
                        podLabels: podlabels
                    },
                    database: {
                        type: "external",
                        external: {
                            host: "harbor-postgres",
                            port: "5432",
                            username: "harbor",
                            coreDatabase: "harbor",
                            existingSecret: "harbor.harbor-postgres.credentials.postgresql.acid.zalan.do",
                            sslmode: "require"
                        }
                    },
                    redis: {
                        type: "external",
                        external: {
                            addr: "harbor-redis:6379"
                        }
                    },
                    exporter: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/harbor-exporter",
                            tag: "v2.11.0"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        },
                        podLabels: podlabels
                    }
                }
            },
            {
                namespace: "harbor",
                name: "prometheus-postgres-exporter",
                chart: "prometheus-postgres-exporter",
                repositoryOpts: {
                    repo: "https://prometheus-community.github.io/helm-charts"
                },
                version: "6.1.0",
                values: {
                    fullnameOverride: "harbor-postgres-exporter",
                    replicaCount: 1,
                    image: {
                        registry: "swr.cn-east-3.myhuaweicloud.com",
                        repository: "quay-io/postgres-exporter"
                    },
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
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    },
                    config: {
                        datasource: {
                            host: 'harbor-postgres',
                            user: "postgres",
                            passwordSecret: {
                                name: "postgres.harbor-postgres.credentials.postgresql.acid.zalan.do",
                                key: "password"
                            },
                            port: "5432",
                            sslmode: "require"
                        },
                        logLevel: "warn"
                    },
                    podLabels: podlabels
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const configmap = new k8s_module.core.v1.ConfigMap('ConfigMap', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [secret, configmap] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [release] });