import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "ingress-nginx",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                chart: "ingress-nginx",
                repository: "https://kubernetes.github.io/ingress-nginx",
                version: "4.0.13",
                values: "./ingress-nginx.yaml"
            }
        ]
    },
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    if (deploy_spec[i].namespace != null) {
        const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
            metadata: deploy_spec[i].namespace.metadata,
            spec: deploy_spec[i].namespace.spec
        });
    }
    // Create Release Resource.
    if (deploy_spec[i].helm != null) {
        for (var helm_index in deploy_spec[i].helm) {
            const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].chart, {
                chart: deploy_spec[i].helm[helm_index].chart,
                repositoryOpts: {
                    repo: deploy_spec[i].helm[helm_index].repository,
                },
                version: deploy_spec[i].helm[helm_index].version,
                namespace: deploy_spec[i].namespace.metadata.name,
                valueYamlFiles: [new FileAsset(deploy_spec[i].helm[helm_index].values)],
                skipAwait: true,
            });
        }
    }
}