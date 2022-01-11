import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const deploy_spec = {
    namespace: {
        metadata: {
            name: "metrics-server",
            annotations: {},
            labels: {}
        },
        spec: {}
    },
    helm: [
        {
            chart: "metrics-server",
            repository: "https://kubernetes-sigs.github.io/metrics-server",
            version: "3.7.0",
            values: "./metrics-server.yaml"
        }
    ]
}

// Create Kubernetes Namespace.
if (deploy_spec.namespace.metadata.name != null) {
    const namespace = new k8s.core.v1.Namespace(deploy_spec.namespace.metadata.name, {
        metadata: deploy_spec.namespace.metadata,
        spec: deploy_spec.namespace.spec
    });
}

// Create Release Resource.
if (deploy_spec.helm != null) {
    for (var index in deploy_spec.helm) {
        const release = new k8s.helm.v3.Release(deploy_spec.helm[index].chart, {
            chart: deploy_spec.helm[index].chart,
            repositoryOpts: {
                repo: deploy_spec.helm[index].repository,
            },
            version: deploy_spec.helm[index].version,
            namespace: deploy_spec.namespace.metadata.name,
            valueYamlFiles: [new FileAsset(deploy_spec.helm[index].values)],
            skipAwait: true,
        });
    }
}