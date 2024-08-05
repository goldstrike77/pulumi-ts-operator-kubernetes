import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

// Generate random minutes from 10 to 59.
const minutes = new random.RandomInteger("minutes", {
    seed: `${pulumi.getStack()}-${pulumi.getProject()}`,
    max: 59,
    min: 10,
});

// Generate random hours from UTC 17 to 21.
const hours = new random.RandomInteger("hours", {
    seed: `${pulumi.getStack()}-${pulumi.getProject()}`,
    max: 21,
    min: 17,
});

let config = new pulumi.Config();

const podlabels = {
    customer: "it",
    environment: "prd",
    project: "Operator",
    group: "Postgres",
    datacenter: "cn-north",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "postgres-operator",
                annotations: {},
                labels: {
                    "pod-security.kubernetes.io/enforce": "privileged",
                    "pod-security.kubernetes.io/audit": "privileged",
                    "pod-security.kubernetes.io/warn": "privileged"
                }
            },
            spec: {}
        },
        release: [
            {
                namespace: "postgres-operator",
                name: "postgres-operator",
                chart: "postgres-operator",
                repositoryOpts: {
                    repo: "https://opensource.zalando.com/postgres-operator/charts/postgres-operator"
                },
                version: "1.12.2",
                values: {
                    image: {
                        registry: "ccr.ccs.tencentyun.com",
                        repository: "ghcr-io/postgres-operator",
                        tag: "v1.12.2",
                    },
                    podLabels: podlabels,
                    configGeneral: {
                        docker_image: "ccr.ccs.tencentyun.com/ghcr-io/spilo-16:3.2-p3",
                        workers: 2
                    },
                    configDebug: {
                        debug_logging: false,
                        enable_database_access: true
                    },
                    configLogicalBackup: {
                        logical_backup_docker_image: "ccr.ccs.tencentyun.com/ghcr-io/logical-backup:v1.12.2",
                        logical_backup_job_prefix: "logical-backup-",
                        logical_backup_provider: "s3",
                        logical_backup_s3_access_key_id: config.require("AWS_ACCESS_KEY_ID"),
                        logical_backup_s3_bucket: "backup",
                        logical_backup_s3_region: "us-east-1",
                        logical_backup_s3_endpoint: "http://obs.home.local:9000",
                        logical_backup_s3_secret_access_key: config.require("AWS_SECRET_ACCESS_KEY"),
                        logical_backup_s3_sse: "",
                        logical_backup_s3_retention_time: "3 days",
                        logical_backup_schedule: pulumi.interpolate`${minutes.result} ${hours.result} * * *`,
                    },
                    configConnectionPooler: {
                        connection_pooler_image: "ccr.ccs.tencentyun.com/ghcr-io/pgbouncer:master-32"
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "256Mi" },
                        requests: { cpu: "100m", memory: "256Mi" }
                    },
                }
            },
            {
                namespace: "postgres-operator",
                name: "postgres-operator-ui",
                chart: "postgres-operator-ui",
                repositoryOpts: {
                    repo: "https://opensource.zalando.com/postgres-operator/charts/postgres-operator-ui"
                },
                version: "1.12.2",
                values: {
                    replicaCount: 1,
                    image: {
                        registry: "ccr.ccs.tencentyun.com",
                        repository: "ghcr-io/postgres-operator-ui",
                        tag: "v1.12.2"
                    },
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    envs: {
                        appUrl: "https://postgres-operator.home.local",
                        resourcesVisible: "True",
                        targetNamespace: "postgres-operator",
                        teams: ["toolchain", "devops", "infra"]
                    },
                    extraEnvs: [
                        { name: "WALE_S3_ENDPOINT", value: "http+path://storage.home.local:9000" },
                        { name: "SPILO_S3_BACKUP_PREFIX", value: "spilo/" },
                        { name: "AWS_ACCESS_KEY_ID", value: config.require("AWS_ACCESS_KEY_ID") },
                        { name: "AWS_SECRET_ACCESS_KEY", value: config.require("AWS_SECRET_ACCESS_KEY") },
                        { name: "AWS_DEFAULT_REGION", value: "us-east-1" },
                        { name: "SPILO_S3_BACKUP_BUCKET", value: "backup" }
                    ],
                    ingress: { enabled: false }
                }
            }
        ],
        customresource: [
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixRoute",
                metadata: {
                    name: "postgres-operator",
                    namespace: "postgres-operator"
                },
                spec: {
                    http: [
                        {
                            name: "root",
                            match: {
                                methods: ["GET", "HEAD"],
                                hosts: ["postgres-operator.home.local"],
                                paths: ["/*"]
                            },
                            backends: [
                                {
                                    serviceName: "postgres-operator-ui",
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
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [namespace] });