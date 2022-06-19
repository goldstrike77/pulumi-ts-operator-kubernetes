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
        secret: [
            {
                metadata: {
                    name: "basic-auth",
                    namespace: "longhorn-system",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {},
                stringData: {
                    "auth": "admin:$apr1$sdfvLCI7$L0iMWekg57WuLr7CVFB5f."
                }
            }
        ],
        helm: [
            {
                namespace: "longhorn-system",
                name: "longhorn",
                chart: "../../_chart/longhorn-1.3.0.tgz",
                // repository: "https://charts.longhorn.io",
                repository: "", // Must be empty string if local chart.
                version: "1.3.0",
                values: "./longhorn.yaml"
            }
        ],
        //        customresource: [
        //            {
        //                apiVersion: "monitoring.coreos.com/v1",
        //                kind: "ServiceMonitor",
        //                metadata: {
        //                    name: "longhorn",
        //                    namespace: "longhorn-system",
        //                    annotations: {},
        //                    labels: {
        //                        name: "longhorn"
        //                    }
        //                },
        //                others: {
        //                    "spec": {
        //                        "selector": {
        //                            "matchLabels": {
        //                                "app": "longhorn-manager"
        //                            },
        //                            "namespaceSelector": {
        //                                "matchNames": [
        //                                    "longhorn-system"
        //                                ]
        //                            },
        //                            "endpoints": [
        //                                "port: manager"
        //                            ]
        //                        }
        //                    }
        //                }
        //            }
        //        ]
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
        if (deploy_spec[i].helm[helm_index].repository === "") {
            const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
                namespace: deploy_spec[i].helm[helm_index].namespace,
                name: deploy_spec[i].helm[helm_index].name,
                chart: deploy_spec[i].helm[helm_index].chart,
                version: deploy_spec[i].helm[helm_index].version,
                valueYamlFiles: [new FileAsset(deploy_spec[i].helm[helm_index].values)],
                skipAwait: true,
            }, { dependsOn: [namespace] });
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
            }, { dependsOn: [namespace] });
        }
    }
    // Create Custom Resource.
    //    for (var custom_index in deploy_spec[i].customresource) {
    //        const customresource = new k8s.apiextensions.CustomResource(deploy_spec[i].customresource[custom_index].metadata.name, {
    //            apiVersion: deploy_spec[i].customresource[custom_index].apiVersion,
    //            kind: deploy_spec[i].customresource[custom_index].kind,
    //            metadata: deploy_spec[i].customresource[custom_index].metadata,
    //            others: deploy_spec[i].customresource[custom_index].others
    //        }, { dependsOn: [namespace] });
    //    }
}