import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "metrics-server",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "metrics-server",
            name: "metrics-server",
            chart: "metrics-server",
            repository: "https://kubernetes-sigs.github.io/metrics-server",
            version: "3.11.0",
            values: {
                image: { repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/metrics-server", tag: "v0.6.4" },
                podLabels: { customer: "demo", environment: "dev", project: "Resource", group: "Metrics-server", datacenter: "dc01", domain: "local" },
                defaultArgs: [
                    "--cert-dir=/tmp",
                    "--kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname",
                    "--kubelet-use-node-status-port",
                    "--metric-resolution=15s",
                    "--kubelet-insecure-tls"
                ],
                metrics: { enabled: true },
                resources: {
                    limits: { cpu: "200m", memory: "128Mi" },
                    requests: { cpu: "200m", memory: "128Mi" }
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