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
                    name: "thanos-objstore-secret",
                    namespace: "monitoring",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "objstore.yml": "dHlwZTogczMKY29uZmlnOgogIGJ1Y2tldDogdGhhbm9zLXNvdXRoZXIKICBlbmRwb2ludDogZGVtby1wcmQtY2x1c3Rlci1zdG9yYWdlLW1pbmlvLW9zcy5zZXJ2aWNlLmRjMDEubG9jYWwKICBhY2Nlc3Nfa2V5OiBHQTgxQ0U2Uk1MQVpaOEVURVpDRwogIHNlY3JldF9rZXk6IEFRSFVjTU43enU2bzlxM01FQkZ5TUc5dWQ0OU5wMjRJM2VFS2M2cmEKICBpbnNlY3VyZTogZmFsc2UKICBodHRwX2NvbmZpZzoKICAgIGlkbGVfY29ubl90aW1lb3V0OiAybQogICAgcmVzcG9uc2VfaGVhZGVyX3RpbWVvdXQ6IDVtCiAgICBpbnNlY3VyZV9za2lwX3ZlcmlmeTogdHJ1ZQo=",
                    "index-cache.yml": "dHlwZTogTUVNQ0FDSEVECmNvbmZpZzoKICBhZGRyZXNzZXM6IFsidGhhbm9zLXN0b3JlLW1lbWNhY2hlZC1pbmRleDoxMTIxMSJdCiAgdGltZW91dDogNTAwbXMKICBtYXhfaWRsZV9jb25uZWN0aW9uczogMTAwCiAgbWF4X2l0ZW1fc2l6ZTogMU1pQgogIG1heF9hc3luY19jb25jdXJyZW5jeTogMTAKICBtYXhfYXN5bmNfYnVmZmVyX3NpemU6IDEwMDAwCiAgbWF4X2dldF9tdWx0aV9jb25jdXJyZW5jeTogMTAwCiAgbWF4X2dldF9tdWx0aV9iYXRjaF9zaXplOiAwCiAgZG5zX3Byb3ZpZGVyX3VwZGF0ZV9pbnRlcnZhbDogMTBzCiAgZXhwaXJhdGlvbjogMjRoCiAgYXV0b19kaXNjb3Zlcnk6IGZhbHNlCg==",
                    "bucket-cache.yml": "dHlwZTogTUVNQ0FDSEVECmNvbmZpZzoKICBhZGRyZXNzZXM6IFsidGhhbm9zLXN0b3JlLW1lbWNhY2hlZC1idWNrZXQ6MTEyMTEiXQogIHRpbWVvdXQ6IDUwMG1zCiAgbWF4X2lkbGVfY29ubmVjdGlvbnM6IDEwMAogIG1heF9pdGVtX3NpemU6IDFNaUIKICBtYXhfYXN5bmNfY29uY3VycmVuY3k6IDEwCiAgbWF4X2FzeW5jX2J1ZmZlcl9zaXplOiAxMDAwMAogIG1heF9nZXRfbXVsdGlfY29uY3VycmVuY3k6IDEwMAogIG1heF9nZXRfbXVsdGlfYmF0Y2hfc2l6ZTogMAogIGRuc19wcm92aWRlcl91cGRhdGVfaW50ZXJ2YWw6IDEwcwogIGV4cGlyYXRpb246IDI0aAogIGF1dG9fZGlzY292ZXJ5OiBmYWxzZQo="
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "monitoring",
                name: "thanos-store-memcached-index",
                chart: "../../_chart/memcached-6.0.2.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "", // Must be empty string if local chart.
                version: "6.0.2",
                values: "./memcached.yaml"
            },
            {
                namespace: "monitoring",
                name: "thanos-store-memcached-bucket",
                chart: "../../_chart/memcached-6.0.2.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "", // Must be empty string if local chart.
                version: "6.0.2",
                values: "./memcached.yaml"
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