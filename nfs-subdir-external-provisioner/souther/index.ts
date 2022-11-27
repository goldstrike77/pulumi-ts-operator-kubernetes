import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "nfs-subdir-external-provisioner",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "nfs-subdir-external-provisioner",
                name: "nfs-subdir-external-provisioner",
                chart: "nfs-subdir-external-provisioner",
                repository: "https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner",
                version: "4.0.17",
                values: {
                    replicaCount: 2,
                    image: {
                        repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/nfs-subdir-external-provisioner"
                    },
                    nfs: {
                        server: "node00.node.home.local",
                        path: "/data/nfs"
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    labels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" }
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