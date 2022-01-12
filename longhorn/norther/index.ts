import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "longhorn-system",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "longhorn-system",
                chart: "longhorn",
                repository: "https://charts.longhorn.io",
                version: "1.2.3",
                values: "./longhorn.yaml"
            }
        ],
        customresource: [
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "ServiceMonitor",
                metadata: {
                    name: "longhorn",
                    namespace: "longhorn-system",
                    annotations: {},
                    labels: {
                        name: "longhorn"
                    }
                },
                others: {
                    "spec": {
                        "selector": {
                            "matchLabels": {
                                "app": "longhorn-manager"
                            },
                            "namespaceSelector": {
                                "matchNames": [
                                    "longhorn-system"
                                ]
                            },
                            "endpoints": [
                                "port: manager"
                            ]
                        }
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
    // Create Release Resource.
    for (var helm_index in deploy_spec[i].helm) {
        const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].chart, {
            chart: deploy_spec[i].helm[helm_index].chart,
            repositoryOpts: {
                repo: deploy_spec[i].helm[helm_index].repository,
            },
            version: deploy_spec[i].helm[helm_index].version,
            namespace: deploy_spec[i].helm[helm_index].namespace,
            valueYamlFiles: [new FileAsset(deploy_spec[i].helm[helm_index].values)],
            skipAwait: true,
        });
    }
    // Create Custom Resource.
    for (var custom_index in deploy_spec[i].customresource) {
        const customresource = new k8s.apiextensions.CustomResource(deploy_spec[i].customresource[custom_index].metadata.name, {
            apiVersion: deploy_spec[i].customresource[custom_index].apiVersion,
            kind: deploy_spec[i].customresource[custom_index].kind,
            metadata: deploy_spec[i].customresource[custom_index].metadata,
            others: deploy_spec[i].customresource[custom_index].others
        });
    }
}