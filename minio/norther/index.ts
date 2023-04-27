import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "minio-operator",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        operator: {
            namespace: "minio-operator",
            name: "operator",
            chart: "operator",
            repository: "https://operator.min.io",
            version: "5.0.4",
            values: {
                operator: {
                    replicaCount: 1,
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    }
                },
                console: {
                    replicaCount: 1,
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    },
                    ingress: {
                        enabled: true,
                        ingressClassName: "nginx",
                        annotations: {
                            "nginx.ingress.kubernetes.io/proxy-connect-timeout": "300",
                            "nginx.ingress.kubernetes.io/proxy-read-timeout": "300",
                            "nginx.ingress.kubernetes.io/proxy-send-timeout": "300"
                        },
                        host: "minio-console.norther.example.com"
                    }
                }
            }
        },
        tenant: [
            {
                namespace: "minio-operator",
                name: "tenant",
                chart: "tenant",
                repository: "https://operator.min.io",
                version: "5.0.4",
                values: {
                    secrets: {
                        accessKey: "admin",
                        secretKey: config.require("adminPassword")
                    },
                    tenant: {
                        name: "demo",
                        pools: [
                            {
                                servers: 4,
                                name: "pool-0",
                                volumesPerServer: 1,
                                size: "50Gi",
                                storageClassName: "longhorn",
                                labels: { customer: "demo", environment: "dev", project: "Storage", group: "Minio-Tenant", datacenter: "dc01", domain: "local" },
                                resources: {
                                    limits: { cpu: "1000m", memory: "3072Mi" },
                                    requests: { cpu: "1000m", memory: "3072Mi" }
                                }
                            }
                        ],
                        metrics: { enabled: true },
                        buckets: [
                            {
                                name: "thanos",
                                region: "us-east-1",
                                lifecycle: [],
                            }
                        ]
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
    // Create Minio Operator Release Resource.
    const operator = new k8s.helm.v3.Release(deploy_spec[i].operator.name, {
        namespace: deploy_spec[i].operator.namespace,
        name: deploy_spec[i].operator.name,
        chart: deploy_spec[i].operator.chart,
        version: deploy_spec[i].operator.version,
        values: deploy_spec[i].operator.values,
        skipAwait: true,
        repositoryOpts: {
            repo: deploy_spec[i].operator.repository,
        },
    }, { dependsOn: [namespace] });
    // Create Minio Tenant Release Resource.
    for (var helm_index in deploy_spec[i].tenant) {
        const tenant = new k8s.helm.v3.Release(deploy_spec[i].tenant[helm_index].name, {
            namespace: deploy_spec[i].tenant[helm_index].namespace,
            name: deploy_spec[i].tenant[helm_index].name,
            chart: deploy_spec[i].tenant[helm_index].chart,
            version: deploy_spec[i].tenant[helm_index].version,
            values: deploy_spec[i].tenant[helm_index].values,
            skipAwait: true,
            repositoryOpts: {
                repo: deploy_spec[i].tenant[helm_index].repository,
            },
        }, { dependsOn: [operator] });
    }
}