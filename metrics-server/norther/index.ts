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
        helm: [
            {
                namespace: "metrics-server",
                name: "metrics-server",
                chart: "metrics-server",
                repository: "https://kubernetes-sigs.github.io/metrics-server",
                version: "3.8.3",
                values: {
                    image: { repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/metrics-server", tag: "v0.6.2" },
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
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
        ]
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create Release Resource.
    for (var helm_index in deploy_spec[i].helm) {
        const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
            namespace: deploy_spec[i].helm[helm_index].namespace,
            name: deploy_spec[i].helm[helm_index].name,
            chart: deploy_spec[i].helm[helm_index].chart,
            version: deploy_spec[i].helm[helm_index].version,
            values: deploy_spec[i].helm[helm_index].values,
            skipAwait: true,
            repositoryOpts: {
                repo: deploy_spec[i].helm[helm_index].repository,
            },
        }, { dependsOn: [namespace] });
    }
}