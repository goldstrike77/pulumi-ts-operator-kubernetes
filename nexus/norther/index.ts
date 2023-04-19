import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "nexus",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "nexus",
            name: "nexus",
            chart: "nexus-repository-manager",
            repository: "https://sonatype.github.io/helm3-charts",
            version: "51.0.0",
            values: {
                fullnameOverride: "nexus-repository-manager",
                image: {
                    repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/nexus3",
                    tag: "3.51.0"
                },
                nexus: {
                    docker: {
                        enabled: true
                    },
                    resources: {
                        limits: { cpu: "1000m", memory: "3072Mi" },
                        requests: { cpu: "1000m", memory: "3072Mi" }
                    }
                },
                ingress: {
                    enabled: true,
                    ingressClassName: "nginx",
                    annotations: {
                        "nginx.ingress.kubernetes.io/proxy-body-size": "0"
                    },
                    hostRepo: "nexus.example.com"
                },
                persistence: {
                    enabled: true,
                    storageClass: "longhorn",
                    storageSize: "8Gi"
                }
            }
        }
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create Release Resource.
    const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
        namespace: deploy_spec[i].helm.namespace,
        name: deploy_spec[i].helm.name,
        chart: deploy_spec[i].helm.chart,
        version: deploy_spec[i].helm.version,
        values: deploy_spec[i].helm.values,
        skipAwait: true,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    }, { dependsOn: [namespace] });
}