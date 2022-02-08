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
                    "objstore.yml": "dHlwZTogczMKY29uZmlnOgogIGJ1Y2tldDogdGhhbm9zLW5vcnRoZXIKICBlbmRwb2ludDogZGVtby1wcmQtY2x1c3Rlci1zdG9yYWdlLW1pbmlvLW9zcy5zZXJ2aWNlLmRjMDEubG9jYWwKICBhY2Nlc3Nfa2V5OiBHQTgxQ0U2Uk1MQVpaOEVURVpDRwogIHNlY3JldF9rZXk6IEFRSFVjTU43enU2bzlxM01FQkZ5TUc5dWQ0OU5wMjRJM2VFS2M2cmEKICBpbnNlY3VyZTogZmFsc2UKICBodHRwX2NvbmZpZzoKICAgIGlkbGVfY29ubl90aW1lb3V0OiAybQogICAgcmVzcG9uc2VfaGVhZGVyX3RpbWVvdXQ6IDVtCiAgICBpbnNlY3VyZV9za2lwX3ZlcmlmeTogdHJ1ZQo=",
                    "alertmanager.tmpl": "e3sgZGVmaW5lICJfX3N1YmplY3QiIH19W3t7IC5TdGF0dXMgfCB0b1VwcGVyIH19e3sgaWYgZXEgLlN0YXR1cyAiZmlyaW5nIiB9fTp7eyAuQWxlcnRzLkZpcmluZyB8IGxlbiB9fXt7IGVuZCB9fV0ge3sgLkdyb3VwTGFiZWxzLlNvcnRlZFBhaXJzLlZhbHVlcyB8IGpvaW4gIiAiIH19IHt7IGlmIGd0IChsZW4gLkNvbW1vbkxhYmVscykgKGxlbiAuR3JvdXBMYWJlbHMpIH19KHt7IHdpdGggLkNvbW1vbkxhYmVscy5SZW1vdmUgLkdyb3VwTGFiZWxzLk5hbWVzIH19e3sgLlZhbHVlcyB8IGpvaW4gIiAiIH19e3sgZW5kIH19KXt7IGVuZCB9fXt7IGVuZCB9fQp7eyBkZWZpbmUgIl9fZGVzY3JpcHRpb24iIH19e3sgZW5kIH19ICAgICAgCnt7IGRlZmluZSAiX190ZXh0X2FsZXJ0X2ZpcmluZ19saXN0IiB9fXt7IHJhbmdlIC4gfX0KU3RhcnQ6IHt7IC5TdGFydHNBdC5Mb2NhbC5Gb3JtYXQgIk1vbiwgMDIgSmFuIDIwMDYgMTU6MDQ6MDUgTVNUIiB9fQp7eyByYW5nZSAuTGFiZWxzLlNvcnRlZFBhaXJzIH19e3sgLk5hbWUgfCB0aXRsZSB9fToge3sgLlZhbHVlIH19Cnt7IGVuZCB9fXt7IHJhbmdlIC5Bbm5vdGF0aW9ucy5Tb3J0ZWRQYWlycyB9fXt7IC5OYW1lIHwgdGl0bGUgfX06IHt7IC5WYWx1ZSB9fXt7IGVuZCB9fQp7eyBlbmQgfX17eyBlbmQgfX0gICAgICAKe3sgZGVmaW5lICJfX3RleHRfYWxlcnRfcmVzb2x2ZWRfbGlzdCIgfX17eyByYW5nZSAuIH19ClN0YXJ0OiB7eyAuU3RhcnRzQXQuTG9jYWwuRm9ybWF0ICJNb24sIDAyIEphbiAyMDA2IDE1OjA0OjA1IE1TVCIgfX0KRW5kOiAgIHt7IC5FbmRzQXQuTG9jYWwuRm9ybWF0ICJNb24sIDAyIEphbiAyMDA2IDE1OjA0OjA1IE1TVCIgfX0KRHVyYXRpb246IHt7ICguRW5kc0F0LlN1YiAuU3RhcnRzQXQpLlRydW5jYXRlIDEwMDAwMDAwMDAgfX0Ke3sgcmFuZ2UgLkxhYmVscy5Tb3J0ZWRQYWlycyB9fXt7IC5OYW1lIHwgdGl0bGUgfX06IHt7IC5WYWx1ZSB9fQp7eyBlbmQgfX17eyByYW5nZSAuQW5ub3RhdGlvbnMuU29ydGVkUGFpcnMgfX17eyAuTmFtZSB8IHRpdGxlIH19OiB7eyAuVmFsdWUgfX17eyBlbmQgfX0Ke3sgZW5kIH19e3sgZW5kIH19ICAgICAgCnt7IGRlZmluZSAid2VjaGF0LmRlZmF1bHQubWVzc2FnZSIgfX17eyBpZiBndCAobGVuIC5BbGVydHMuRmlyaW5nKSAwIC19fQpXQVJOSU5HIOKYogp7eyB0ZW1wbGF0ZSAiX190ZXh0X2FsZXJ0X2ZpcmluZ19saXN0IiAuQWxlcnRzLkZpcmluZyB9fQp7ey0gZW5kIH19e3sgaWYgZ3QgKGxlbiAuQWxlcnRzLlJlc29sdmVkKSAwIC19fQpSRVNPTFZFRCDinYAKe3sgdGVtcGxhdGUgIl9fdGV4dF9hbGVydF9yZXNvbHZlZF9saXN0IiAuQWxlcnRzLlJlc29sdmVkIH19Cnt7LSBlbmQgfX0Ke3stIGVuZCB9fQp7eyBkZWZpbmUgIndlY2hhdC5kZWZhdWx0LmFwaV9zZWNyZXQiIH19e3sgZW5kIH19Cnt7IGRlZmluZSAid2VjaGF0LmRlZmF1bHQudG9fdXNlciIgfX17eyBlbmQgfX0Ke3sgZGVmaW5lICJ3ZWNoYXQuZGVmYXVsdC50b19wYXJ0eSIgfX17eyBlbmQgfX0Ke3sgZGVmaW5lICJ3ZWNoYXQuZGVmYXVsdC50b190YWciIH19e3sgZW5kIH19Cnt7IGRlZmluZSAid2VjaGF0LmRlZmF1bHQuYWdlbnRfaWQiIH19e3sgZW5kIH19ICAgIAo=",
                    "alertmanager.yaml": "Z2xvYmFsOgogIGh0dHBfY29uZmlnOgogICAgdGxzX2NvbmZpZzoKICAgICAgaW5zZWN1cmVfc2tpcF92ZXJpZnk6IHRydWUgICAgCiAgcmVzb2x2ZV90aW1lb3V0OiA1bQpyb3V0ZToKICBncm91cF9ieTogWydqb2InXQogIGdyb3VwX3dhaXQ6IDFtCiAgZ3JvdXBfaW50ZXJ2YWw6IDFtCiAgcmVwZWF0X2ludGVydmFsOiAyaAogIHJlY2VpdmVyOiAnd2VjaGF0JwogIHJvdXRlczoKICAtIG1hdGNoOgogICAgICBhbGVydG5hbWU6IFdhdGNoZG9nCiAgICBjb250aW51ZTogdHJ1ZQogICAgcmVjZWl2ZXI6ICdudWxsJwogIC0gbWF0Y2g6CiAgICByZWNlaXZlcjogJ3dlY2hhdCcKICAgIGNvbnRpbnVlOiB0cnVlCnJlY2VpdmVyczoKLSBuYW1lOiAnbnVsbCcKLSBuYW1lOiAnd2VjaGF0JwogIHdlY2hhdF9jb25maWdzOgogIC0gc2VuZF9yZXNvbHZlZDogdHJ1ZQogICAgdG9fcGFydHk6ICc1JwogICAgYWdlbnRfaWQ6ICcxMDAwMDA1JwogICAgY29ycF9pZDogJ3d4ZTc4NzYwNWYxZDE3MDBkYScKICAgIGFwaV9zZWNyZXQ6ICcwQmZqV1pod3FGaTBJVUhOOHNNaDBKRWQ4OTM4M2lpbjFUVGFKYWpKX1NJJwp0ZW1wbGF0ZXM6Ci0gJy9ldGMvYWxlcnRtYW5hZ2VyL2NvbmZpZy8qLnRtcGwnCg=="
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
                name: "thanos-queryfrontend-memcached",
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