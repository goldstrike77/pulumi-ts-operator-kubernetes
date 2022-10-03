import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "minio",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "minio",
                name: "minio",
                chart: "minio",
                repository: "https://charts.bitnami.com/bitnami",
                version: "11.10.3",
                values: {
                    mode: "distributed",
                    auth: {
                        rootUser: "admin",
                        rootPassword: config.require("rootPassword")
                    },
                    statefulset: {
                        podManagementPolicy: "Parallel",
                        replicaCount: 4,
                        zones: 1,
                        drivesPerNode: 1
                    },
                    provisioning: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        policies: [
                            {
                                name: "readonly-specific-policy",
                                statements: [
                                    {
                                        resources: ["arn:aws:s3:::*"],
                                        effect: "Allow",
                                        actions: ["s3:GetBucketLocation", "s3:ListBucket", "s3:GetObject", "s3:ListBucketMultipartUploads"]
                                    }
                                ]
                            },
                            {
                                name: "backup-bucket-specific-policy",
                                statements: [
                                    {
                                        resources: ["arn:aws:s3:::backup"],
                                        effect: "Allow",
                                        actions: ["s3:GetBucketLocation", "s3:ListBucket", "s3:ListBucketMultipartUploads"]
                                    },
                                    {
                                        resources: ["arn:aws:s3:::backup/*"],
                                        effect: "Allow",
                                        actions: ["s3:AbortMultipartUpload", "s3:DeleteObject", "s3:GetObject", "s3:ListMultipartUploadParts", "s3:PutObject"]
                                    }
                                ]
                            }
                        ],
                        users: [
                            {
                                username: "superuser",
                                password: config.require("superPassword"),
                                disabled: false,
                                policies: ["readwrite", "consoleAdmin", "diagnostics"],
                                setPolicies: true
                            },
                            {
                                username: "readonly",
                                password: config.require("readonlyPassword"),
                                disabled: false,
                                policies: ["readonly-specific-policy"],
                                setPolicies: true
                            },
                            {
                                username: "backup",
                                password: config.require("backupPassword"),
                                disabled: false,
                                policies: ["backup-bucket-specific-policy"],
                                setPolicies: true
                            }
                        ],
                        buckets: [
                            {
                                name: "test",
                                region: "us-east-1",
                                versioning: false,
                                withLock: true,
                                lifecycle: [
                                    {
                                        id: "TestPrefix7dRetention",
                                        prefix: "test-prefix",
                                        disabled: false,
                                        expiry: {
                                            days: "7",
                                            nonconcurrentDays: "3"
                                        }
                                    }
                                ],
                                quota: { type: "hard", size: "10GiB", },
                                tags: {}
                            },
                            {
                                name: "backup",
                                region: "us-east-1",
                                versioning: false,
                                withLock: true,
                                lifecycle: [
                                    {
                                        id: "BackupPrefix7dRetention",
                                        prefix: "backup-prefix",
                                        disabled: false,
                                        expiry: {
                                            days: "7",
                                            nonconcurrentDays: "3"
                                        }
                                    }
                                ],
                                quota: { type: "hard", size: "10GiB", },
                                tags: {}
                            },
                        ]
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "500m", memory: "4096Mi" },
                        requests: { cpu: "500m", memory: "4096Mi" }
                    },
                    ingress: {
                        enabled: true,
                        ingressClassName: "nginx",
                        hostname: "minio-console.example.com",
                        annotations: {
                            "nginx.ingress.kubernetes.io/client-body-buffer-size": "100m",
                            "nginx.ingress.kubernetes.io/proxy-body-size": "100m",
                            "nginx.ingress.kubernetes.io/proxy-connect-timeout": "300",
                            "nginx.ingress.kubernetes.io/proxy-read-timeout": "300",
                            "nginx.ingress.kubernetes.io/proxy-send-timeout": "300"
                        }
                    },
                    apiIngress: {
                        enabled: true,
                        ingressClassName: "nginx",
                        hostname: "minio-api.example.com",
                        annotations: {
                            "nginx.ingress.kubernetes.io/client-body-buffer-size": "100m",
                            "nginx.ingress.kubernetes.io/proxy-body-size": "100m",
                            "nginx.ingress.kubernetes.io/proxy-connect-timeout": "300",
                            "nginx.ingress.kubernetes.io/proxy-read-timeout": "300",
                            "nginx.ingress.kubernetes.io/proxy-send-timeout": "300"
                        }
                    },
                    persistence: {
                        enabled: true,
                        storageClass: "longhorn",
                        mountPath: "/data",
                        size: "50Gi"
                    },
                    volumePermissions: {
                        enabled: false,
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        }
                    },
                    metrics: {
                        serviceMonitor: {
                            enabled: true,
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ],
                        },
                        prometheusRule: {
                            enabled: true,
                            rules: []
                        }
                    },
                    gateway: { enabled: false }
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