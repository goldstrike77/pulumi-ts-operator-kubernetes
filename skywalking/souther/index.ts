import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "skywalking",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "auth-secret",
                    namespace: "skywalking",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    auth: Buffer.from("admin:$apr1$sdfvLCI7$L0iMWekg57WuLr7CVFB5f.").toString('base64')
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "skywalking",
                name: "skywalking",
                chart: "../../_chart/skywalking-4.2.0.tgz",
                repository: "",
                version: "4.2.0",
                values: {
                    oap: {
                        storageType: "elasticsearch",
                        replicas: 1,
                        image: { tag: "9.2.0" },
                        javaOpts: "-Xmx3g -Xms3g",
                        resources: {
                            requests: { cpu: "1000m", memory: "4096Mi" }
                        },
                        env: {
                            SW_STORAGE_ES_CLUSTER_NODES: "opensearch-master.opensearch.svc.cluster.local:9200",
                            SW_STORAGE_ES_HTTP_PROTOCOL: "http",
                            SW_ES_USER: "admin",
                            SW_ES_PASSWORD: "password",
                            SW_STORAGE_ES_CONNECT_TIMEOUT: "1000",
                            SW_STORAGE_ES_INDEX_SHARDS_NUMBER: "1",
                            SW_STORAGE_ES_INDEX_REPLICAS_NUMBER: "1",
                            SW_STORAGE_ES_FLUSH_INTERVAL: "15"
                        }
                    },
                    ui: {
                        replicas: 1,
                        image: { tag: "9.2.0" },
                        ingress: {
                            enabled: true,
                            annotations: {
                                "kubernetes.io/ingress.class": "nginx",
                                "nginx.ingress.kubernetes.io/auth-type": "basic",
                                "nginx.ingress.kubernetes.io/auth-secret": "auth-secret",
                                "nginx.ingress.kubernetes.io/auth-realm": "Authentication Required ",
                            },
                            path: "/",
                            hosts: ["skywalking.example.com"]
                        }
                    },
                    elasticsearch: {
                        enabled: false,
                        config: {
                            port: { http: 9200 },
                            host: "opensearch-master.opensearch.svc.cluster.local"
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
        const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
            namespace: deploy_spec[i].helm[helm_index].namespace,
            name: deploy_spec[i].helm[helm_index].name,
            chart: deploy_spec[i].helm[helm_index].chart,
            version: deploy_spec[i].helm[helm_index].version,
            values: deploy_spec[i].helm[helm_index].values,
            skipAwait: true,
        }, { dependsOn: [namespace] });
    }
}