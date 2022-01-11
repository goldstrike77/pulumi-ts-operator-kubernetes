import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "metrics-server",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            chart: "metrics-server",
            repository: "https://kubernetes-sigs.github.io/metrics-server",
            version: "3.7.0",
            values: "./metrics-server.yaml"
        }
    },
    {
        namespace: {
            metadata: {
                name: "metallb-system",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            chart: "metallb",
            repository: "https://charts.bitnami.com/bitnami",
            version: "2.5.16",
            values: "./metallb.yaml"
        }
    },
]

for (var index in deploy_spec) {
    // Create Kubernetes Namespace.
    if (deploy_spec[index].namespace != null) {
        const namespace = new k8s.core.v1.Namespace(deploy_spec[index].namespace.metadata.name, {
            metadata: deploy_spec[index].namespace.metadata,
            spec: deploy_spec[index].namespace.spec
        });
    }
    // Create Release Resource.
    if (deploy_spec[index].helm != null) {
        const release = new k8s.helm.v3.Release(deploy_spec[index].helm.chart, {
            chart: deploy_spec[index].helm.chart,
            repositoryOpts: {
                repo: deploy_spec[index].helm.repository,
            },
            version: deploy_spec[index].helm.version,
            namespace: deploy_spec[index].namespace.metadata.name,
            valueYamlFiles: [new FileAsset(deploy_spec[index].helm.values)],
            skipAwait: true,
        });
    }
}