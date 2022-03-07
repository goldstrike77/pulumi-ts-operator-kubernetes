import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "alerta",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "mongodb-secret",
                    namespace: "alerta",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "mongodb-root-password": "cGFzc3dvcmQ=",
                    "mongodb-replica-set-key": "cGFzc3dvcmQ=",
                    "mongodb-password": "cGFzc3dvcmQ="
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "alerta",
                name: "alerta",
                chart: "../../_chart/alerta.tgz",
                // repository: "https://github.com/alerta/docker-alerta",
                repository: "", // Must be empty string if local chart.
                version: "0.1",
                values: "./alerta.yaml"
            },
            {
                namespace: "alerta",
                name: "mongodb",
                chart: "../../_chart/mongodb-11.0.6.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "", // Must be empty string if local chart.
                version: "11.0.6",
                values: "./mongodb.yaml"
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
}