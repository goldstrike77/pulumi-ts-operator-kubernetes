import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "monitoring",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "monitoring",
                chart: "thanos",
                repository: "https://charts.bitnami.com/bitnami",
                version: "8.3.0",
                values: "./thanos.yaml"
            },
            {
                namespace: "monitoring",
                chart: "kube-state-metrics",
                repository: "https://prometheus-community.github.io/helm-charts",
                version: "4.4.0",
                values: "./kube-state-metrics.yaml"
            },
            {
                namespace: "monitoring",
                chart: "kube-prometheus-stack",
                repository: "https://prometheus-community.github.io/helm-charts",
                version: "30.0.1",
                values: "./kube-prometheus-stack.yaml"
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