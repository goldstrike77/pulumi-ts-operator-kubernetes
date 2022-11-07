import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

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
        helm: [
            {
                namespace: "postgres-operator",
                name: "pg-operator",
                chart: "pg-operator",
                repository: "https://percona.github.io/percona-helm-charts",
                version: "1.3.0",
                values: {
                    archive_mode: "true",
                    archive_timeout: "60",
                    backrest_aws_s3_bucket: "backup",
                    backrest_aws_s3_endpoint: "http://minio.minio.svc.cluster.local:9000",
                    backrest_aws_s3_key: config.require("AWS_ACCESS_KEY_ID"),
                    backrest_aws_s3_region: "us-east-1",
                    backrest_aws_s3_secret: config.require("AWS_SECRET_ACCESS_KEY"),
                    backrest_aws_s3_verify_tls: "false",
                    metrics: "true",
                    pgo_admin_password: config.require("adminPassword"),
                    disable_telemetry: "true"
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