import * as k8s_module from '../../../module/pulumi-ts-module-kubernetes';

const labels = {
    customer: "demo",
    environment: "dev",
    project: "Storage",
    group: "NFS",
    datacenter: "dc01",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "nfs-subdir",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        release: [
            {
                namespace: "nfs-subdir",
                name: "nfs-subdir-external-provisioner",
                chart: "nfs-subdir-external-provisioner",
                repositoryOpts: {
                    repo: "https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner"
                },
                version: "4.0.18",
                values: {
                    replicaCount: 1,
                    image: {
                        repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/nfs-subdir-external-provisioner"
                    },
                    nfs: {
                        server: "storage.home.local",
                        path: "/data/nfs"
                    },
                    storageClass: {
                        create: true,
                        name: "nfs-sc"
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    labels: labels
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources });