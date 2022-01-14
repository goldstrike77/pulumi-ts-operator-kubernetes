import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "metallb-system",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "metallb-system",
                chart: "metallb",
                repository: "https://charts.bitnami.com/bitnami",
                version: "2.5.16",
                values: "./metallb.yaml"
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
        const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].chart, {
            name: deploy_spec[i].helm[helm_index].chart,
            namespace: deploy_spec[i].helm[helm_index].namespace,
            chart: deploy_spec[i].helm[helm_index].chart,
            repositoryOpts: {
                repo: deploy_spec[i].helm[helm_index].repository,
            },
            version: deploy_spec[i].helm[helm_index].version,
            valueYamlFiles: [new FileAsset(deploy_spec[i].helm[helm_index].values)],
            skipAwait: true,
        }, { dependsOn: [namespace] });
    }
}