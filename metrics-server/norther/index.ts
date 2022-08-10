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
                chart: "../../_chart/metrics-server-3.8.2.tgz",
                // repository: "https://kubernetes-sigs.github.io/metrics-server",
                repository: "", // Must be empty string if local chart.
                version: "3.8.2",
                values: {
                    image: { repository: "registry.cn-hangzhou.aliyuncs.com/google_containers/metrics-server" },
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    defaultArgs: [
                        "--cert-dir=/tmp",
                        "--kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname",
                        "--kubelet-use-node-status-port",
                        "--metric-resolution=15s",
                        "--kubelet-insecure-tls"
                    ],
                    resources: {
                        limits: { cpu: "250m", memory: "256Mi" },
                        requests: { cpu: "250m", memory: "256Mi" }
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
        if (deploy_spec[i].helm[helm_index].repository === "") {
            const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
                namespace: deploy_spec[i].helm[helm_index].namespace,
                name: deploy_spec[i].helm[helm_index].name,
                chart: deploy_spec[i].helm[helm_index].chart,
                version: deploy_spec[i].helm[helm_index].version,
                values: deploy_spec[i].helm[helm_index].values,
                skipAwait: true,
            }, { dependsOn: [namespace] });
        }
        else {
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
}