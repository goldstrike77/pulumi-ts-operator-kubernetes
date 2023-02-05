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
        helm: {
            namespace: "minio",
            name: "minio",
            chart: "minio",
            repository: "https://charts.bitnami.com/bitnami",
            version: "12.1.3",
            values: {
                mode: "standalone",
                auth: {
                    rootUser: "admin",
                    rootPassword: config.require("rootPassword")
                },
                provisioning: {
                    enabled: true,
                    policies: [
                        {
                            name: "thanos-bucket-specific-policy",
                            statements: [
                                {
                                    resources: ["arn:aws:s3:::thanos"],
                                    effect: "Allow",
                                    actions: ["s3:GetBucketLocation", "s3:ListBucket", "s3:ListBucketMultipartUploads"]
                                },
                                {
                                    resources: ["arn:aws:s3:::thanos/*"],
                                    effect: "Allow",
                                    actions: ["s3:AbortMultipartUpload", "s3:DeleteObject", "s3:GetObject", "s3:ListMultipartUploadParts", "s3:PutObject"]
                                }
                            ]
                        },
                        {
                            name: "loki-bucket-specific-policy",
                            statements: [
                                {
                                    resources: ["arn:aws:s3:::loki"],
                                    effect: "Allow",
                                    actions: ["s3:GetBucketLocation", "s3:ListBucket", "s3:ListBucketMultipartUploads"]
                                },
                                {
                                    resources: ["arn:aws:s3:::loki/*"],
                                    effect: "Allow",
                                    actions: ["s3:AbortMultipartUpload", "s3:DeleteObject", "s3:GetObject", "s3:ListMultipartUploadParts", "s3:PutObject"]
                                }
                            ]
                        },
                        {
                            name: "tempo-bucket-specific-policy",
                            statements: [
                                {
                                    resources: ["arn:aws:s3:::tempo"],
                                    effect: "Allow",
                                    actions: ["s3:GetBucketLocation", "s3:ListBucket", "s3:ListBucketMultipartUploads"]
                                },
                                {
                                    resources: ["arn:aws:s3:::tempo/*"],
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
                            username: "thanos",
                            password: config.require("thanosPassword"),
                            disabled: false,
                            policies: ["thanos-bucket-specific-policy"],
                            setPolicies: true
                        },
                        {
                            username: "loki",
                            password: config.require("lokiPassword"),
                            disabled: false,
                            policies: ["loki-bucket-specific-policy"],
                            setPolicies: true
                        },
                        {
                            username: "tempo",
                            password: config.require("tempoPassword"),
                            disabled: false,
                            policies: ["tempo-bucket-specific-policy"],
                            setPolicies: true
                        }
                    ],
                    buckets: [
                        {
                            name: "thanos",
                            region: "us-east-1",
                            versioning: false,
                            withLock: true,
                            lifecycle: [],
                            quota: { type: "hard", size: "50GiB", },
                            tags: {}
                        },
                        {
                            name: "loki",
                            region: "us-east-1",
                            versioning: false,
                            withLock: true,
                            lifecycle: [],
                            quota: { type: "hard", size: "50GiB", },
                            tags: {}
                        },
                        {
                            name: "tempo",
                            region: "us-east-1",
                            versioning: false,
                            withLock: true,
                            lifecycle: [],
                            quota: { type: "hard", size: "50GiB", },
                            tags: {}
                        }
                    ]
                },
                // nodeSelector: { "minio/node": "true" },
                podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "central", datacenter: "dc01", domain: "local" },
                resources: {
                    limits: { cpu: "200m", memory: "2048Mi" },
                    requests: { cpu: "200m", memory: "2048Mi" }
                },
                ingress: {
                    enabled: true,
                    ingressClassName: "nginx",
                    hostname: "minio-console.central.example.com",
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
                    hostname: "minio-api.central.example.com",
                    annotations: {
                        "nginx.ingress.kubernetes.io/client-body-buffer-size": "100m",
                        "nginx.ingress.kubernetes.io/proxy-body-size": "100m",
                        "nginx.ingress.kubernetes.io/proxy-connect-timeout": "300",
                        "nginx.ingress.kubernetes.io/proxy-read-timeout": "300",
                        "nginx.ingress.kubernetes.io/proxy-send-timeout": "300"
                    }
                },
                persistence: { enabled: false },
                volumePermissions: { enabled: false },
                metrics: {
                    serviceMonitor: {
                        enabled: true,
                        interval: "60s",
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