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
        secret: [
            {
                metadata: {
                    name: "configuration-secret",
                    namespace: "monitoring",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "objstore.yml": "dHlwZTogczMKY29uZmlnOgogIGJ1Y2tldDogdGhhbm9zLXNvdXRoZXIKICBlbmRwb2ludDogZGVtby1wcmQtY2x1c3Rlci1zdG9yYWdlLW1pbmlvLW9zcy5zZXJ2aWNlLmRjMDEubG9jYWwKICBhY2Nlc3Nfa2V5OiBHQTgxQ0U2Uk1MQVpaOEVURVpDRwogIHNlY3JldF9rZXk6IEFRSFVjTU43enU2bzlxM01FQkZ5TUc5dWQ0OU5wMjRJM2VFS2M2cmEKICBpbnNlY3VyZTogZmFsc2UKICBodHRwX2NvbmZpZzoKICAgIGlkbGVfY29ubl90aW1lb3V0OiAybQogICAgcmVzcG9uc2VfaGVhZGVyX3RpbWVvdXQ6IDVtCiAgICBpbnNlY3VyZV9za2lwX3ZlcmlmeTogdHJ1ZQo="
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "monitoring",
                name: "thanos-redis",
                chart: "../../_chart/redis-16.5.2.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "", // Must be empty string if local chart.
                version: "16.5.2",
                values: "./redis.yaml"
            },
            {
                namespace: "monitoring",
                name: "thanos",
                chart: "../../_chart/thanos-9.0.3.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "", // Must be empty string if local chart.
                version: "9.0.3",
                values: "./thanos.yaml"
            },
            {
                namespace: "monitoring",
                name: "kube-prometheus-stack",
                chart: "../../_chart/kube-prometheus-stack-31.0.0.tgz",
                // repository: "https://prometheus-community.github.io/helm-charts",
                repository: "", // Must be empty string if local chart.                
                version: "31.0.0",
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