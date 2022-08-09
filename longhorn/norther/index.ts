import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "longhorn-system",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "basic-auth",
                    namespace: "longhorn-system",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {},
                stringData: {
                    "auth": "admin:$apr1$sdfvLCI7$L0iMWekg57WuLr7CVFB5f."
                }
            }
        ],
        helm: [
            {
                namespace: "longhorn-system",
                name: "longhorn",
                chart: "../../_chart/longhorn-1.3.0.tgz",
                // repository: "https://charts.longhorn.io",
                repository: "", // Must be empty string if local chart.
                version: "1.3.0",
                values: {
                    global: { cattle: { systemDefaultRegistry: "registry.cn-hangzhou.aliyuncs.com" } },
                    image: {
                        longhorn: {
                            engine: { repository: "rancher/mirrored-longhornio-longhorn-engine" },
                            manager: { repository: "rancher/mirrored-longhornio-longhorn-manager" },
                            ui: { repository: "rancher/mirrored-longhornio-longhorn-ui" },
                            instanceManager: { repository: "rancher/mirrored-longhornio-longhorn-instance-manager" },
                            shareManager: { repository: "rancher/mirrored-longhornio-longhorn-share-manager" },
                            backingImageManager: { repository: "rancher/mirrored-longhornio-backing-image-manager" }
                        },
                        csi: {
                            attacher: { repository: "rancher/mirrored-longhornio-csi-attacher" },
                            provisioner: { repository: "rancher/mirrored-longhornio-csi-provisioner" },
                            nodeDriverRegistrar: { repository: "rancher/mirrored-longhornio-csi-node-driver-registrar" },
                            resizer: { repository: "rancher/mirrored-longhornio-csi-resizer" },
                            snapshotter: { repository: "rancher/mirrored-longhornio-csi-snapshotter" }
                        }
                    },
                    persistence: { defaultDataLocality: "best-effort" },
                    defaultSettings: {
                        defaultDataPath: "/data/longhorn",
                        replicaAutoBalance: "best-effort",
                        systemManagedComponentsNodeSelector: "longhorn/node:true"
                    },
                    longhornManager: { nodeSelector: { "longhorn/node": "true" } },
                    longhornDriver: { nodeSelector: { "longhorn/node": "true" } },
                    longhornUI: { nodeSelector: { "longhorn/node": "true" } },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    ingress: {
                        enabled: true,
                        ingressClassName: "nginx",
                        host: "norther.example.com",
                        path: "/longhorn(/|$)(.*)",
                        annotations: {
                            "nginx.ingress.kubernetes.io/auth-type": "basic",
                            "nginx.ingress.kubernetes.io/auth-secret": "basic-auth",
                            "nginx.ingress.kubernetes.io/auth-realm": "Authentication Required ",
                            "nginx.ingress.kubernetes.io/rewrite-target": "/$2",
                            "nginx.ingress.kubernetes.io/proxy-body-size": "10000m",
                            "nginx.ingress.kubernetes.io/configuration-snippet": "rewrite ^(/longhorn)$ $1/ redirect;"
                        }
                    }
                }
            }
        ],
        yaml: [
            { name: "./servicemonitor.yaml" },
        ]
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create Kubernetes Secret.
    for (var secret_index in deploy_spec[i].secret) {
        const secret = new k8s.core.v1.Secret(deploy_spec[i].secret[secret_index].metadata.name, {
            metadata: deploy_spec[i].secret[secret_index].metadata,
            type: deploy_spec[i].secret[secret_index].type,
            data: deploy_spec[i].secret[secret_index].data,
            stringData: deploy_spec[i].secret[secret_index].stringData
        }, { dependsOn: [namespace] });
    }
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
    // Create service monitor.
/**
    for (var yaml_index in deploy_spec[i].yaml) {
        const guestbook = new k8s.yaml.ConfigFile(deploy_spec[i].yaml[yaml_index].name, {
            file: deploy_spec[i].yaml[yaml_index].name,
            skipAwait: true,
        }, { dependsOn: [namespace] });
    }
 */
}