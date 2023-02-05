import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "metallb-system",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "metallb-system",
            name: "metallb",
            chart: "metallb",
            repository: "https://charts.bitnami.com/bitnami",
            version: "4.1.14",
            values: {
                addresses: ["192.168.0.170-192.168.0.179"],
                autoAssign: true,
                prometheusRule: { enabled: false },
                controller: {
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "central", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "100m", memory: "64Mi" },
                        requests: { cpu: "100m", memory: "64Mi" }
                    },
                    metrics: {
                        enabled: true,
                        serviceMonitor: {
                            enabled: false,
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        }
                    }
                },
                speaker: {
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "central", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "100m", memory: "64Mi" },
                        requests: { cpu: "100m", memory: "64Mi" }
                    },
                    metrics: {
                        enabled: true,
                        serviceMonitor: {
                            enabled: false,
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        }
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
        skipAwait: false,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    }, { dependsOn: [namespace] });
    const ipaddresspool = new k8s.apiextensions.CustomResource(deploy_spec[i].helm.name, {
        apiVersion: "metallb.io/v1beta1",
        kind: "IPAddressPool",
        metadata: {
            name: "generic-cluster-pool",
            namespace: deploy_spec[i].namespace.metadata.name
        },
        spec: {
            addresses: deploy_spec[i].helm.values.addresses,
            autoAssign: deploy_spec[i].helm.values.autoAssign,
        }
    }, { dependsOn: [release] });
    const l2advertisement = new k8s.apiextensions.CustomResource(deploy_spec[i].helm.name, {
        apiVersion: "metallb.io/v1beta1",
        kind: "L2Advertisement",
        metadata: {
            name: "generic-cluster-pool",
            namespace: deploy_spec[i].namespace.metadata.name
        },
        spec: {
            ipAddressPools: ["generic-cluster-pool"]
        }
    }, { dependsOn: [ipaddresspool] });
}