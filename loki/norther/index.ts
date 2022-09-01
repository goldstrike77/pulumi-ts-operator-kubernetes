import * as k8s from "@pulumi/kubernetes";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "logging",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "loki-conf-secret",
                    namespace: "logging",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "config.yaml": "YXV0aF9lbmFibGVkOiBmYWxzZQ0KY2h1bmtfc3RvcmVfY29uZmlnOg0KICBjaHVua19jYWNoZV9jb25maWc6DQogICAgZW5hYmxlX2ZpZm9jYWNoZTogZmFsc2UNCiAgICBtZW1jYWNoZWQ6DQogICAgICBiYXRjaF9zaXplOiAxMDANCiAgICAgIGV4cGlyYXRpb246IDFoDQogICAgICBwYXJhbGxlbGlzbTogMTAwDQogICAgbWVtY2FjaGVkX2NsaWVudDoNCiAgICAgIGNvbnNpc3RlbnRfaGFzaDogdHJ1ZQ0KICAgICAgaG9zdDogbG9raS1tZW1jYWNoZWQtY2h1bmtzDQogICAgICBtYXhfaWRsZV9jb25uczogMTYNCiAgICAgIHNlcnZpY2U6IGh0dHANCiAgICAgIHRpbWVvdXQ6IDVzDQogICAgICB1cGRhdGVfaW50ZXJ2YWw6IDFtDQogIG1heF9sb29rX2JhY2tfcGVyaW9kOiAwcw0KY29tcGFjdG9yOg0KICBjb21wYWN0aW9uX2ludGVydmFsOiAyaA0KICByZXRlbnRpb25fZGVsZXRlX2RlbGF5OiAyaA0KICByZXRlbnRpb25fZGVsZXRlX3dvcmtlcl9jb3VudDogMTUwDQogIHJldGVudGlvbl9lbmFibGVkOiB0cnVlDQogIHNoYXJlZF9zdG9yZTogczMNCiAgd29ya2luZ19kaXJlY3Rvcnk6IC92YXIvbG9raS9jb21wYWN0b3INCmRpc3RyaWJ1dG9yOg0KICByaW5nOg0KICAgIGt2c3RvcmU6DQogICAgICBzdG9yZTogbWVtYmVybGlzdA0KZnJvbnRlbmQ6DQogIGNvbXByZXNzX3Jlc3BvbnNlczogdHJ1ZQ0KICBsb2dfcXVlcmllc19sb25nZXJfdGhhbjogNXMNCiAgdGFpbF9wcm94eV91cmw6IGh0dHA6Ly9sb2tpLXF1ZXJpZXI6MzEwMA0KZnJvbnRlbmRfd29ya2VyOg0KICBmcm9udGVuZF9hZGRyZXNzOiBsb2tpLXF1ZXJ5LWZyb250ZW5kOjkwOTUNCiAgcGFyYWxsZWxpc206IDEwDQppbmdlc3RlcjoNCiAgY2h1bmtfYmxvY2tfc2l6ZTogMzI3NjgNCiAgY2h1bmtfZW5jb2Rpbmc6IHNuYXBweQ0KICBjaHVua19pZGxlX3BlcmlvZDogMzBtDQogIGNodW5rX3JldGFpbl9wZXJpb2Q6IDFtDQogIGxpZmVjeWNsZXI6DQogICAgcmluZzoNCiAgICAgIGt2c3RvcmU6DQogICAgICAgIHN0b3JlOiBtZW1iZXJsaXN0DQogICAgICByZXBsaWNhdGlvbl9mYWN0b3I6IDINCiAgbWF4X3RyYW5zZmVyX3JldHJpZXM6IDANCiAgd2FsOg0KICAgIGRpcjogL3Zhci9sb2tpL3dhbA0KbGltaXRzX2NvbmZpZzoNCiAgZW5mb3JjZV9tZXRyaWNfbmFtZTogZmFsc2UNCiAgaW5nZXN0aW9uX2J1cnN0X3NpemVfbWI6IDY0DQogIGluZ2VzdGlvbl9yYXRlX21iOiAzMg0KICBpbmdlc3Rpb25fcmF0ZV9zdHJhdGVneTogZ2xvYmFsDQogIG1heF9jYWNoZV9mcmVzaG5lc3NfcGVyX3F1ZXJ5OiAxMG0NCiAgbWF4X2VudHJpZXNfbGltaXRfcGVyX3F1ZXJ5OiAxMDAwMA0KICBtYXhfZ2xvYmFsX3N0cmVhbXNfcGVyX3VzZXI6IDEwMDAwMA0KICBtYXhfbGluZV9zaXplOiAzMmtiDQogIG1heF9saW5lX3NpemVfdHJ1bmNhdGU6IHRydWUNCiAgcmVqZWN0X29sZF9zYW1wbGVzOiB0cnVlDQogIHJlamVjdF9vbGRfc2FtcGxlc19tYXhfYWdlOiAxNjhoDQogIHJldGVudGlvbl9wZXJpb2Q6IDc0NGgNCiAgc3BsaXRfcXVlcmllc19ieV9pbnRlcnZhbDogMTVtDQptZW1iZXJsaXN0Og0KICBqb2luX21lbWJlcnM6DQogIC0gbG9raS1tZW1iZXJsaXN0DQpxdWVyaWVyOg0KICBtYXhfY29uY3VycmVudDogMzANCiAgcXVlcnlfc3RvcmVfb25seTogZmFsc2UNCiAgcXVlcnlfdGltZW91dDogNjBzDQpxdWVyeV9yYW5nZToNCiAgYWxpZ25fcXVlcmllc193aXRoX3N0ZXA6IHRydWUNCiAgY2FjaGVfcmVzdWx0czogdHJ1ZQ0KICBtYXhfcmV0cmllczogNQ0KICByZXN1bHRzX2NhY2hlOg0KICAgIGNhY2hlOg0KICAgICAgbWVtY2FjaGVkX2NsaWVudDoNCiAgICAgICAgY29uc2lzdGVudF9oYXNoOiB0cnVlDQogICAgICAgIGhvc3Q6IGxva2ktbWVtY2FjaGVkLWZyb250ZW5kDQogICAgICAgIG1heF9pZGxlX2Nvbm5zOiAxNg0KICAgICAgICBzZXJ2aWNlOiBodHRwDQogICAgICAgIHRpbWVvdXQ6IDVzDQogICAgICAgIHVwZGF0ZV9pbnRlcnZhbDogMW0NCnJ1bGVyOg0KICBhbGVydG1hbmFnZXJfdXJsOiBodHRwczovL2FsZXJ0bWFuYWdlci54eA0KICBleHRlcm5hbF91cmw6IGh0dHBzOi8vYWxlcnRtYW5hZ2VyLnh4DQogIHJpbmc6DQogICAga3ZzdG9yZToNCiAgICAgIHN0b3JlOiBtZW1iZXJsaXN0DQogIHJ1bGVfcGF0aDogL3RtcC9sb2tpL3NjcmF0Y2gNCiAgc3RvcmFnZToNCiAgICBsb2NhbDoNCiAgICAgIGRpcmVjdG9yeTogL2V0Yy9sb2tpL3J1bGVzDQogICAgdHlwZTogbG9jYWwNCnNjaGVtYV9jb25maWc6DQogIGNvbmZpZ3M6DQogIC0gY2h1bmtzOg0KICAgICAgcGVyaW9kOiAyNGgNCiAgICAgIHByZWZpeDogbG9raV9jaHVua18NCiAgICBmcm9tOiAiMjAyMC0wOS0wNyINCiAgICBpbmRleDoNCiAgICAgIHBlcmlvZDogMjRoDQogICAgICBwcmVmaXg6IGxva2lfaW5kZXhfDQogICAgb2JqZWN0X3N0b3JlOiBhd3MNCiAgICBzY2hlbWE6IHYxMQ0KICAgIHN0b3JlOiBib2x0ZGItc2hpcHBlcg0Kc2VydmVyOg0KICBncnBjX2xpc3Rlbl9wb3J0OiA5MDk1DQogIGdycGNfc2VydmVyX21heF9zZW5kX21zZ19zaXplOiAzMjc2ODAwMDANCiAgZ3JwY19zZXJ2ZXJfbWF4X3JlY3ZfbXNnX3NpemU6IDMyNzY4MDAwMA0KICBodHRwX2xpc3Rlbl9wb3J0OiAzMTAwDQogIGh0dHBfc2VydmVyX3JlYWRfdGltZW91dDogNjBzDQogIGh0dHBfc2VydmVyX3dyaXRlX3RpbWVvdXQ6IDYwcw0KICBsb2dfbGV2ZWw6IGluZm8NCnN0b3JhZ2VfY29uZmlnOg0KICBhd3M6DQogICAgYWNjZXNzX2tleV9pZDogR0E4MUNFNlJNTEFaWjhFVEVaQ0cNCiAgICBidWNrZXRuYW1lczogbG9raQ0KICAgIGVuZHBvaW50OiBkZW1vLXByZC1jbHVzdGVyLXN0b3JhZ2UtbWluaW8tb3NzLnNlcnZpY2UuZGMwMS5sb2NhbA0KICAgIGh0dHBfY29uZmlnOg0KICAgICAgaWRsZV9jb25uX3RpbWVvdXQ6IDJtDQogICAgICBpbnNlY3VyZV9za2lwX3ZlcmlmeTogdHJ1ZQ0KICAgICAgcmVzcG9uc2VfaGVhZGVyX3RpbWVvdXQ6IDVtDQogICAgaW5zZWN1cmU6IGZhbHNlDQogICAgcmVnaW9uOiBzM19yZWdpb24NCiAgICBzM2ZvcmNlcGF0aHN0eWxlOiB0cnVlDQogICAgc2VjcmV0X2FjY2Vzc19rZXk6IEFRSFVjTU43enU2bzlxM01FQkZ5TUc5dWQ0OU5wMjRJM2VFS2M2cmENCiAgICBzc2VfZW5jcnlwdGlvbjogZmFsc2UNCiAgYm9sdGRiX3NoaXBwZXI6DQogICAgYWN0aXZlX2luZGV4X2RpcmVjdG9yeTogL3Zhci9sb2tpL2luZGV4DQogICAgY2FjaGVfbG9jYXRpb246IC92YXIvbG9raS9jYWNoZQ0KICAgIGNhY2hlX3R0bDogMTY4aA0KICAgIHNoYXJlZF9zdG9yZTogczMNCiAgZmlsZXN5c3RlbToNCiAgICBkaXJlY3Rvcnk6IC92YXIvbG9raS9jaHVua3MNCiAgaW5kZXhfY2FjaGVfdmFsaWRpdHk6IDVtDQogIGluZGV4X3F1ZXJpZXNfY2FjaGVfY29uZmlnOg0KICAgIGVuYWJsZV9maWZvY2FjaGU6IGZhbHNlDQogICAgbWVtY2FjaGVkOg0KICAgICAgYmF0Y2hfc2l6ZTogMTAwDQogICAgICBleHBpcmF0aW9uOiAxaA0KICAgICAgcGFyYWxsZWxpc206IDEwMA0KICAgIG1lbWNhY2hlZF9jbGllbnQ6DQogICAgICBjb25zaXN0ZW50X2hhc2g6IHRydWUNCiAgICAgIGhvc3Q6IGxva2ktbWVtY2FjaGVkLWluZGV4LXF1ZXJpZXMNCiAgICAgIG1heF9pZGxlX2Nvbm5zOiAxNg0KICAgICAgc2VydmljZTogaHR0cA0KICAgICAgdGltZW91dDogNXMNCiAgICAgIHVwZGF0ZV9pbnRlcnZhbDogMW0NCiAgbWF4X2NodW5rX2JhdGNoX3NpemU6IDEwMA0KYW5hbHl0aWNzOg0KICByZXBvcnRpbmdfZW5hYmxlZDogZmFsc2U="
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "logging",
                name: "loki",
                chart: "loki-distributed",
                repository: "https://grafana.github.io/helm-charts",
                version: "0.56.6",
                values: {
                    nameOverride: "loki",
                    loki: {
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        existingSecretForConfig: "loki-conf-secret",
                        config: "",
                    },
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
                    prometheusRule: { enabled: true },
                    ingester: {
                        replicas: 2,
                        resources: {
                            limits: { cpu: "200m", memory: "512Mi" },
                            requests: { cpu: "200m", memory: "512Mi" }
                        },
                        persistence: { enabled: true, size: "10Gi", storageClass: "longhorn" }
                    },
                    distributor: {
                        replicas: 2,
                        resources: {
                            limits: { cpu: "200m", memory: "128Mi" },
                            requests: { cpu: "200m", memory: "128Mi" }
                        }
                    },
                    querier: {
                        replicas: 2,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        }
                    },
                    queryFrontend: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        }
                    },
                    gateway: {
                        enabled: true,
                        replicas: 2,
                        verboseLogging: false,
                        resources: {
                            limits: { cpu: "200m", memory: "128Mi" },
                            requests: { cpu: "200m", memory: "128Mi" }
                        },
                        service: {
                            port: 8080,
                            type: "LoadBalancer",
                            loadBalancerIP: "10.101.4.42",
                            annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
                        }
                    },
                    compactor: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        persistence: { enabled: true, size: "8Gi", storageClass: "longhorn" }
                    },
                    ruler: { enabled: false, replicas: 1, resources: {}, directories: {} },
                    memcachedExporter: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "200m", memory: "64Mi" },
                            requests: { cpu: "200m", memory: "64Mi" }
                        }
                    },
                    memcachedChunks: {
                        enabled: true,
                        extraArgs: ["-m 2000", "-I 2m", "-v"],
                        resources: {
                            limits: { cpu: "1000m", memory: "2048Mi" },
                            requests: { cpu: "1000m", memory: "2048Mi" }
                        }
                    },
                    memcachedFrontend: {
                        enabled: true,
                        extraArgs: ["-m 2000", "-I 2m", "-v"],
                        resources: {
                            limits: { cpu: "1000m", memory: "2048Mi" },
                            requests: { cpu: "1000m", memory: "2048Mi" }
                        }
                    },
                    memcachedIndexQueries: {
                        enabled: true,
                        extraArgs: ["-m 2000", "-I 2m", "-v"],
                        resources: {
                            limits: { cpu: "1000m", memory: "2048Mi" },
                            requests: { cpu: "1000m", memory: "2048Mi" }
                        }
                    },
                    memcachedIndexWrites: { enabled: false }
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
}