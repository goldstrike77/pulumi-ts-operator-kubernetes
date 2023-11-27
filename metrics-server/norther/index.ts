import * as k8s_module from '../../../module/pulumi-ts-module-kubernetes';

const podlabels = {
    customer: "demo",
    environment: "dev",
    project: "Container-resource",
    group: "Metrics-server",
    datacenter: "dc01",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "metrics-server",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        release: [
            {
                namespace: "metrics-server",
                name: "metrics-server",
                chart: "metrics-server",
                repositoryOpts: {
                    repo: "https://kubernetes-sigs.github.io/metrics-server"
                },
                version: "3.11.0",
                values: {
                    image: { repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/metrics-server", tag: "v0.6.4" },
                    podLabels: podlabels,
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

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources });