import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "opensearch",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "opensearch",
                name: "opensearch",
                chart: "../../_chart/opensearch-2.1.0.tgz",
                // repository: "https://opensearch-project.github.io/helm-charts",
                repository: "", // Must be empty string if local chart.
                version: "2.1.0",
                values: "./opensearch.yaml"
            },
            {
                namespace: "opensearch",
                name: "opensearch-dashboards",
                chart: "../../_chart/opensearch-dashboards-2.1.0.tgz",
                // repository: "https://opensearch-project.github.io/helm-charts",
                repository: "", // Must be empty string if local chart.
                version: "2.1.0",
                values: "./opensearch-dashboards.yaml"
            }
//            {
//                namespace: "opensearch",
//                name: "kubernetes-logging",
//                chart: "../../_chart/kubernetes-logging-3.2.8.tgz",
//                // repository: "logging https://nickytd.github.io/kubernetes-logging-helm",
//                repository: "", // Must be empty string if local chart.
//                version: "3.2.8",
//                values: "./kubernetes-logging.yaml"
//            }
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
        if (deploy_spec[i].helm[helm_index].repository === "") {
            const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
                namespace: deploy_spec[i].helm[helm_index].namespace,
                name: deploy_spec[i].helm[helm_index].name,
                chart: deploy_spec[i].helm[helm_index].chart,
                version: deploy_spec[i].helm[helm_index].version,
                valueYamlFiles: [new FileAsset(deploy_spec[i].helm[helm_index].values)],
                skipAwait: true,
            }, { dependsOn: [namespace], customTimeouts: { create: "10m" } });
        }
        else {
            const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
                namespace: deploy_spec[i].helm[helm_index].namespace,
                name: deploy_spec[i].helm[helm_index].name,
                chart: deploy_spec[i].helm[helm_index].chart,
                version: deploy_spec[i].helm[helm_index].version,
                valueYamlFiles: [new FileAsset(deploy_spec[i].helm[helm_index].values)],
                skipAwait: true,
                repositoryOpts: {
                    repo: deploy_spec[i].helm[helm_index].repository,
                },
            }, { dependsOn: [namespace], customTimeouts: { create: "10m" } });
        }
    }
}