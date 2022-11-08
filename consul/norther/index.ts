import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "consul",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "consul",
            name: "consul",
            chart: "../../_chart/consul-0.49.0.tgz",
            // repository: "https://helm.releases.hashicorp.com",
            repository: "",
            version: "0.49.0",
            devel: true,
            values: {
                global: {
                    name: "",
                    domain: "norther",
                    datacenter: "home",
                    gossipEncryption: {
                        autoGenerate: true
                    },
                    recursors: ["192.168.0.1"],
                    tls: {
                        enabled: true,
                        enableAutoEncrypt: true,
                        verify: false
                    },
                    metrics: {
                        enabled: true,
                        enableAgentMetrics: true
                    },
                    consulSidecarContainer: {
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    consulAPITimeout: "10s"
                },
                server: {
                    replicas: 3,
                    storage: "10Gi",
                    storageClass: "nfs-client",
                    resources: {
                        limits: { cpu: "200m", memory: "128Mi" },
                        requests: { cpu: "200m", memory: "128Mi" }
                    },
                    extraLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    exposeService: {
                        type: "LoadBalancer",
                        annotations: null
                    }
                },
                client: {
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    }
                },
                ui: {
                    ingress: {
                        enabled: true,
                        ingressClassName: "nginx",
                        pathType: "ImplementationSpecific",
                        hosts: [
                            {
                                host: "consul.example.com",
                                paths: ["/"]
                            }
                        ]
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
    const release = new k8s.helm.v3.Release(deploy_spec[i].helm.chart, {
        namespace: deploy_spec[i].helm.namespace,
        name: deploy_spec[i].helm.name,
        chart: deploy_spec[i].helm.chart,
        version: deploy_spec[i].helm.version,
        devel: deploy_spec[i].helm.devel,
        values: deploy_spec[i].helm.values,
        skipAwait: false
    }, { dependsOn: [namespace] });
}