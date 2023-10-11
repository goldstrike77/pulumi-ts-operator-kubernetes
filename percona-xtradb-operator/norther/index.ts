import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "xtradb-operator",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "xtradb-operator",
            name: "pxc-operator",
            chart: "pxc-operator",
            repository: "https://percona.github.io/percona-helm-charts",
            version: "1.13.3",
            values: {
                replicaCount: 1,
                watchAllNamespaces: true,
                fullnameOverride: "xtradb-operator",
                resources: {
                    limits: { cpu: "100m", memory: "128Mi" },
                    requests: { cpu: "100m", memory: "128Mi" }
                },
                logLevel: "INFO",
                disableTelemetry: true
            }
        }
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create Release Resource.
    const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
        namespace: deploy_spec[i].helm.namespace,
        name: deploy_spec[i].helm.name,
        chart: deploy_spec[i].helm.chart,
        version: deploy_spec[i].helm.version,
        values: deploy_spec[i].helm.values,
        skipAwait: true,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    }, { dependsOn: [namespace] });
}