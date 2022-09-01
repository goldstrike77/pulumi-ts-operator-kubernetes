import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as random from "@pulumi/random";

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

const deploy_spec = [
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
        helm: [
            {
                namespace: "postgres-operator",
                name: "postgres-operator",
                chart: "../../_chart/postgres-operator-1.8.2.tgz",
                repository: "",
                version: "1.8.2",
                values: {
                    image: {
                        registry: "registry.cn-hangzhou.aliyuncs.com",
                        repository: "goldstrike/postgres-operator",
                        tag: "v1.8.2",
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    configGeneral: {
                        docker_image: "registry.cn-hangzhou.aliyuncs.com/goldstrike/spilo-14:2.1-p6"
                    },
                    configLogicalBackup: {
                        logical_backup_docker_image: "registry.opensource.zalan.do/acid/logical-backup:v1.8.0",
                        logical_backup_job_prefix: "logical-backup-",
                        logical_backup_provider: "s3",
                        logical_backup_s3_access_key_id: config.require("AWS_ACCESS_KEY_ID"),
                        logical_backup_s3_bucket: "backup",
                        logical_backup_s3_region: "us-east-1",
                        logical_backup_s3_endpoint: "http://minio.minio.svc.cluster.local:9000",
                        logical_backup_s3_secret_access_key: config.require("AWS_SECRET_ACCESS_KEY"),
                        logical_backup_s3_sse: "AES256",
                        logical_backup_s3_retention_time: "3 days",
                        logical_backup_schedule: pulumi.interpolate`${minutes.result} ${hours.result} * * *`,
                    },
                    configConnectionPooler: {
                        connection_pooler_image: "registry.cn-hangzhou.aliyuncs.com/goldstrike/pgbouncer:master-22"
                    },
                    resources: {
                        limits: { cpu: "500m", memory: "512Mi" },
                        requests: { cpu: "500m", memory: "512Mi" }
                    },
                }
            },
            {
                namespace: "postgres-operator",
                name: "postgres-operator-ui",
                chart: "../../_chart/postgres-operator-ui-1.8.2.tgz",
                repository: "",
                version: "1.8.2",
                values: {
                    replicaCount: 1,
                    image: {
                        registry: "registry.cn-hangzhou.aliyuncs.com",
                        repository: "goldstrike/postgres-operator-ui",
                        tag: "v1.8.2"
                    },
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    extraEnvs: [
                        {
                            name: "WALE_S3_ENDPOINT",
                            value: "http://minio.minio.svc.cluster.local:9000"
                        },
                        {
                            name: "SPILO_S3_BACKUP_PREFIX",
                            value: "spilo/"
                        },
                        {
                            name: "AWS_ACCESS_KEY_ID",
                            value: config.require("AWS_ACCESS_KEY_ID")
                        },
                        {
                            name: "AWS_SECRET_ACCESS_KEY",
                            value: config.require("AWS_SECRET_ACCESS_KEY")
                        },
                        {
                            name: "AWS_DEFAULT_REGION",
                            value: "us-east-1"
                        },
                        {
                            name: "SPILO_S3_BACKUP_BUCKET",
                            value: "backup"
                        }
                    ],
                    ingress: {
                        enabled: true,
                        annotations: {
                            "nginx.ingress.kubernetes.io/auth-type": "basic",
                            "nginx.ingress.kubernetes.io/auth-secret": "auth-secret",
                            "nginx.ingress.kubernetes.io/auth-realm": "Authentication Required "
                        },
                        ingressClassName: "nginx",
                        hosts: [
                            {
                                host: "postgres-operator.example.com",
                                paths: [""]
                            }
                        ]
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
        }, { dependsOn: [namespace] });
    }
}