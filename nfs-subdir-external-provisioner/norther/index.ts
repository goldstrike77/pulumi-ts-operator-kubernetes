import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "nfs-subdir",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "nfs-subdir",
            name: "nfs-subdir-external-provisioner",
            chart: "nfs-subdir-external-provisioner",
            repository: "https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner",
            version: "4.0.18",
            values: {
                replicaCount: 1,
                image: {
                    repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/nfs-subdir-external-provisioner"
                },
                nfs: {
                    server: "node30.node.home.local",
                    path: "/data/nfs"
                },
                resources: {
                    limits: { cpu: "100m", memory: "128Mi" },
                    requests: { cpu: "100m", memory: "128Mi" }
                },
                labels: { customer: "demo", environment: "dev", project: "Storage", group: "NFS", datacenter: "dc01", domain: "local" }
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