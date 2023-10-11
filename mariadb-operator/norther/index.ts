import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "mariadb-operator",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "mariadb-operator",
            name: "mariadb-operator",
            chart: "mariadb-operator",
            repository: "https://mariadb-operator.github.io/mariadb-operator",
            version: "0.20.0",
            values: {
                fullnameOverride: "mariadb-operator",
                logLevel: "INFO",
                ha: {
                    enabled: true,
                    replicas: 3
                },
                metrics: {
                    enabled: true,
                    serviceMonitor: {
                        enabled: true,
                        additionalLabels: {
                            customer: "demo",
                            datacenter: "dc01",
                            domain: "local",
                            environment: "dev",
                            group: "mariadb",
                            project: "operator"
                        },
                        interval: "60s",
                        scrapeTimeout: "30s"
                    }
                },
                resources: {
                    limits: { cpu: "100m", memory: "128Mi" },
                    requests: { cpu: "100m", memory: "128Mi" }
                },
                webhook: {
                    serviceMonitor: {
                        enabled: true,
                        additionalLabels: {
                            customer: "demo",
                            datacenter: "dc01",
                            domain: "local",
                            environment: "dev",
                            group: "mariadb",
                            project: "operator"
                        },
                        interval: "60s",
                        scrapeTimeout: "30s"
                    },
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    }
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