import * as k8s from "@pulumi/kubernetes";

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
                    name: "auth-secret",
                    namespace: "longhorn-system",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    auth: "YWRtaW46JGFwcjEkc2RmdkxDSTckTDBpTVdla2c1N1d1THI3Q1ZGQjVmLg==",
                    AWS_ACCESS_KEY_ID: "R0E4MUNFNlJNTEFaWjhFVEVaQ0c=",
                    AWS_SECRET_ACCESS_KEY: "QVFIVWNNTjd6dTZvOXEzTUVCRnlNRzl1ZDQ5TnAyNEkzZUVLYzZyYQ==",
                    AWS_ENDPOINTS: "aHR0cHM6Ly9kZW1vLXByZC1jbHVzdGVyLXN0b3JhZ2UtbWluaW8tb3NzLnNlcnZpY2UuZGMwMS5sb2NhbA==",
                    AWS_CERT: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURSRENDQWl3Q0NRQ0xMNHQ3MUp0MW9qQU5CZ2txaGtpRzl3MEJBUXNGQURCa01Rc3dDUVlEVlFRR0V3SlkKV0RFTk1Bc0dBMVVFQ0F3RVRXRnljekVXTUJRR0ExVUVCd3dOVFc5MWJuUWdUMng1YlhCMWN6RVFNQTRHQTFVRQpDZ3dIUTI5dGNHRnVlVEVOTUFzR0ExVUVDd3dFVlc1cGRERU5NQXNHQTFVRUF3d0VVazlQVkRBZUZ3MHlNREEyCk1URXdPVEUyTXpsYUZ3MDBNREEyTVRFd09URTJNemxhTUdReEN6QUpCZ05WQkFZVEFsaFlNUTB3Q3dZRFZRUUkKREFSTllYSnpNUll3RkFZRFZRUUhEQTFOYjNWdWRDQlBiSGx0Y0hWek1SQXdEZ1lEVlFRS0RBZERiMjF3WVc1NQpNUTB3Q3dZRFZRUUxEQVJWYm1sME1RMHdDd1lEVlFRRERBUlNUMDlVTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGCkFBT0NBUThBTUlJQkNnS0NBUUVBMGdwSzNMREZZS2liNVhaczBJbEVML016eDRXZExoaEhDUGVpWU5OS2t4S24KVmFVS0UrTS9CMUsraFRabVlMZkc1VkFPWmdrZHBXcjdwZm1QU045cVd5S05xZGVyQUh6UXU4QTRZYnhiU1NRVgpES1ZjcFFDYUhFZmpjRUtqbDB6RElYMU1LekppQXJKNFlQVENpeGdEbG5pMTk1Qm1EQncxMDBZR2EzancrRHhTCkxMbFI4VEE3eWVMdS8wTm1EVTMxLzN1NWZBVlorVnFzbmx2bitySjg3Wnpka2txNEVQUFhvanBiRElvbCtUTDEKQklXK0tOTE13WjRnOEFHbWR6ZlJQK3p0bU5xbksvTTdqK0toSzdYSTJZcHZrZGhTQ1htZHgvZ1VzNVM4eG1oUApYS2NTTEZZaFdzeGozd285WlhzbXdBamZRYVM2WmZ5NCtGN2p1bkJsRFFJREFRQUJNQTBHQ1NxR1NJYjNEUUVCCkN3VUFBNElCQVFCRHJGL2NlSFd6WHdvYkhvUExMd2krbUp4R3NTNlJPVTNRczJzaUxkQnozNzROTWZBMlN0a2UKTWo0dU9UdmN2Z3psL3lNTVZMZy9zUVhMeW8vZ0VhOVlhNFhkWDRxTmlEY0NwM3g2SjNnbWtsMGtxTzY4N3lRSgpFdW1FV1VXcmZ4Z2p4dEhSMUMvY1RFZ3FjNkYwUldHc1YrMjNkT0JvTG9RQmt2NGNUbGR5ajBGTERJZElId2p3CkFXM1B5MTJZb2JKNTRsdjhqbGZhVUVmNXg3Z3d5TW55MDR1aDRoTTVNR01WR29mK3dRWnVNNGJZMzBkVjUyNnkKQU9xeDEzY0hKek1CRW14aFdRNWdkUDNjOXdKcVVuSSswMDJPTjdiWnI5bVV0Q0Vab0JTdTQxb1Q4bGhjNG00ZApZQjJjak5wTXVSTGpjUzZHZTVyQUJweUFGWW9UVGhYdgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t"
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "longhorn-system",
                name: "longhorn",
                chart: "longhorn",
                repository: "https://charts.longhorn.io",
                version: "1.2.4",
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
                        backupTarget: "s3://backup@us-east-1/",
                        backupTargetCredentialSecret: "auth-secret",
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
                        host: "souther.example.com",
                        path: "/longhorn(/|$)(.*)",
                        annotations: {
                            "nginx.ingress.kubernetes.io/auth-type": "basic",
                            "nginx.ingress.kubernetes.io/auth-secret": "auth-secret",
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
    /**
        // Create service monitor.
        for (var yaml_index in deploy_spec[i].yaml) {
            const guestbook = new k8s.yaml.ConfigFile(deploy_spec[i].yaml[yaml_index].name, {
                file: deploy_spec[i].yaml[yaml_index].name,
                skipAwait: true,
            }, { dependsOn: [namespace] });
        }
     */
}