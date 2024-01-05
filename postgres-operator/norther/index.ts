import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as k8s_module from '../../../module/pulumi-ts-module-kubernetes';

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
    customer: "demo",
    environment: "dev",
    project: "Operator",
    group: "Postgres",
    datacenter: "dc01",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "postgres-operator",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "auth-secret",
                    namespace: "postgres-operator",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: { auth: "YWRtaW46JGFwcjEkc2RmdkxDSTckTDBpTVdla2c1N1d1THI3Q1ZGQjVmLg==" },
                stringData: {}
            }
        ],
        release: [
            {
                namespace: "postgres-operator",
                name: "postgres-operator",
                chart: "../../_chart/postgres-operator-1.10.1.tgz",
                version: "1.10.1",
                values: {
                    image: {
                        registry: "swr.cn-east-3.myhuaweicloud.com",
                        repository: "zalando/postgres-operator",
                        tag: "v1.10.1",
                    },
                    podLabels: podlabels,
                    configGeneral: {
                        docker_image: "swr.cn-east-3.myhuaweicloud.com/zalando/spilo-15:3.0-p1",
                        workers: 2
                    },
                    configDebug: {
                        debug_logging: false,
                        enable_database_access: true
                    },
                    configLogicalBackup: {
                        logical_backup_docker_image: "swr.cn-east-3.myhuaweicloud.com/zalando/logical-backup:v1.10.1",
                        logical_backup_job_prefix: "logical-backup-",
                        logical_backup_provider: "s3",
                        logical_backup_s3_access_key_id: config.require("AWS_ACCESS_KEY_ID"),
                        logical_backup_s3_bucket: "backup",
                        logical_backup_s3_region: "us-east-1",
                        logical_backup_s3_endpoint: "http://storage.home.local:9000",
                        logical_backup_s3_secret_access_key: config.require("AWS_SECRET_ACCESS_KEY"),
                        logical_backup_s3_sse: "AES256",
                        logical_backup_s3_retention_time: "3 days",
                        logical_backup_schedule: pulumi.interpolate`${minutes.result} ${hours.result} * * *`,
                    },
                    configConnectionPooler: {
                        connection_pooler_image: "swr.cn-east-3.myhuaweicloud.com/zalando/pgbouncer:master-27"
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
                chart: "../../_chart/postgres-operator-ui-1.10.1.tgz",
                version: "1.10.1",
                values: {
                    replicaCount: 1,
                    image: {
                        registry: "swr.cn-east-3.myhuaweicloud.com",
                        repository: "zalando/postgres-operator-ui",
                        tag: "v1.10.1"
                    },
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    envs: {
                        appUrl: "https://postgres-operator.example.com",
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
                    ingress: {
                        enabled: true,
                        annotations: {
                            "nginx.ingress.kubernetes.io/backend-protocol": "HTTP",
                            "nginx.ingress.kubernetes.io/auth-type": "basic",
                            "nginx.ingress.kubernetes.io/auth-secret": "auth-secret",
                            "nginx.ingress.kubernetes.io/auth-realm": "Authentication Required "
                        },
                        ingressClassName: "nginx",
                        hosts: [
                            {
                                host: "postgres-operator.example.com",
                                paths: ["/"]
                            }
                        ]
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [secret] });