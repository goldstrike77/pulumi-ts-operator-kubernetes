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
                    "config.yaml": "YXV0aF9lbmFibGVkOiBmYWxzZQ0KY2h1bmtfc3RvcmVfY29uZmlnOg0KICBjaHVua19jYWNoZV9jb25maWc6DQogICAgZW5hYmxlX2ZpZm9jYWNoZTogZmFsc2UNCiAgICBtZW1jYWNoZWQ6DQogICAgICBiYXRjaF9zaXplOiAxMDANCiAgICAgIGV4cGlyYXRpb246IDFoDQogICAgICBwYXJhbGxlbGlzbTogMTAwDQogICAgbWVtY2FjaGVkX2NsaWVudDoNCiAgICAgIGNvbnNpc3RlbnRfaGFzaDogdHJ1ZQ0KICAgICAgaG9zdDogbG9raS1tZW1jYWNoZWQtY2h1bmtzDQogICAgICBtYXhfaWRsZV9jb25uczogMTYNCiAgICAgIHNlcnZpY2U6IGh0dHANCiAgICAgIHRpbWVvdXQ6IDVzDQogICAgICB1cGRhdGVfaW50ZXJ2YWw6IDFtDQogIG1heF9sb29rX2JhY2tfcGVyaW9kOiAwcw0KY29tcGFjdG9yOg0KICBjb21wYWN0aW9uX2ludGVydmFsOiAyaA0KICByZXRlbnRpb25fZGVsZXRlX2RlbGF5OiAyaA0KICByZXRlbnRpb25fZGVsZXRlX3dvcmtlcl9jb3VudDogMTUwDQogIHJldGVudGlvbl9lbmFibGVkOiB0cnVlDQogIHNoYXJlZF9zdG9yZTogczMNCiAgd29ya2luZ19kaXJlY3Rvcnk6IC92YXIvbG9raS9jb21wYWN0b3INCmRpc3RyaWJ1dG9yOg0KICByaW5nOg0KICAgIGt2c3RvcmU6DQogICAgICBzdG9yZTogbWVtYmVybGlzdA0KZnJvbnRlbmQ6DQogIGNvbXByZXNzX3Jlc3BvbnNlczogdHJ1ZQ0KICBsb2dfcXVlcmllc19sb25nZXJfdGhhbjogNXMNCiAgdGFpbF9wcm94eV91cmw6IGh0dHA6Ly9sb2tpLXF1ZXJpZXI6MzEwMA0KZnJvbnRlbmRfd29ya2VyOg0KICBmcm9udGVuZF9hZGRyZXNzOiBsb2tpLXF1ZXJ5LWZyb250ZW5kOjkwOTUNCiAgcGFyYWxsZWxpc206IDEwDQppbmdlc3RlcjoNCiAgY2h1bmtfYmxvY2tfc2l6ZTogMzI3NjgNCiAgY2h1bmtfZW5jb2Rpbmc6IHNuYXBweQ0KICBjaHVua19pZGxlX3BlcmlvZDogMzBtDQogIGNodW5rX3JldGFpbl9wZXJpb2Q6IDFtDQogIGxpZmVjeWNsZXI6DQogICAgcmluZzoNCiAgICAgIGt2c3RvcmU6DQogICAgICAgIHN0b3JlOiBtZW1iZXJsaXN0DQogICAgICByZXBsaWNhdGlvbl9mYWN0b3I6IDINCiAgbWF4X3RyYW5zZmVyX3JldHJpZXM6IDANCiAgd2FsOg0KICAgIGRpcjogL3Zhci9sb2tpL3dhbA0KbGltaXRzX2NvbmZpZzoNCiAgZW5mb3JjZV9tZXRyaWNfbmFtZTogZmFsc2UNCiAgaW5nZXN0aW9uX2J1cnN0X3NpemVfbWI6IDY0DQogIGluZ2VzdGlvbl9yYXRlX21iOiAzMg0KICBpbmdlc3Rpb25fcmF0ZV9zdHJhdGVneTogZ2xvYmFsDQogIG1heF9jYWNoZV9mcmVzaG5lc3NfcGVyX3F1ZXJ5OiAxMG0NCiAgbWF4X2VudHJpZXNfbGltaXRfcGVyX3F1ZXJ5OiAxMDAwMA0KICBtYXhfZ2xvYmFsX3N0cmVhbXNfcGVyX3VzZXI6IDEwMDAwMA0KICBtYXhfbGluZV9zaXplOiAzMmtiDQogIG1heF9saW5lX3NpemVfdHJ1bmNhdGU6IHRydWUNCiAgcmVqZWN0X29sZF9zYW1wbGVzOiB0cnVlDQogIHJlamVjdF9vbGRfc2FtcGxlc19tYXhfYWdlOiAxNjhoDQogIHJldGVudGlvbl9wZXJpb2Q6IDc0NGgNCiAgc3BsaXRfcXVlcmllc19ieV9pbnRlcnZhbDogMTVtDQptZW1iZXJsaXN0Og0KICBqb2luX21lbWJlcnM6DQogIC0gbG9raS1tZW1iZXJsaXN0DQpxdWVyaWVyOg0KICBtYXhfY29uY3VycmVudDogMzANCiAgcXVlcnlfc3RvcmVfb25seTogZmFsc2UNCiAgcXVlcnlfdGltZW91dDogNjBzDQpxdWVyeV9yYW5nZToNCiAgYWxpZ25fcXVlcmllc193aXRoX3N0ZXA6IHRydWUNCiAgY2FjaGVfcmVzdWx0czogdHJ1ZQ0KICBtYXhfcmV0cmllczogNQ0KICByZXN1bHRzX2NhY2hlOg0KICAgIGNhY2hlOg0KICAgICAgbWVtY2FjaGVkX2NsaWVudDoNCiAgICAgICAgY29uc2lzdGVudF9oYXNoOiB0cnVlDQogICAgICAgIGhvc3Q6IGxva2ktbWVtY2FjaGVkLWZyb250ZW5kDQogICAgICAgIG1heF9pZGxlX2Nvbm5zOiAxNg0KICAgICAgICBzZXJ2aWNlOiBodHRwDQogICAgICAgIHRpbWVvdXQ6IDVzDQogICAgICAgIHVwZGF0ZV9pbnRlcnZhbDogMW0NCnJ1bGVyOg0KICBhbGVydG1hbmFnZXJfdXJsOiBodHRwczovL2FsZXJ0bWFuYWdlci54eA0KICBleHRlcm5hbF91cmw6IGh0dHBzOi8vYWxlcnRtYW5hZ2VyLnh4DQogIHJpbmc6DQogICAga3ZzdG9yZToNCiAgICAgIHN0b3JlOiBtZW1iZXJsaXN0DQogIHJ1bGVfcGF0aDogL3RtcC9sb2tpL3NjcmF0Y2gNCiAgc3RvcmFnZToNCiAgICBsb2NhbDoNCiAgICAgIGRpcmVjdG9yeTogL2V0Yy9sb2tpL3J1bGVzDQogICAgdHlwZTogbG9jYWwNCnNjaGVtYV9jb25maWc6DQogIGNvbmZpZ3M6DQogIC0gY2h1bmtzOg0KICAgICAgcGVyaW9kOiAyNGgNCiAgICAgIHByZWZpeDogbG9raV9jaHVua18NCiAgICBmcm9tOiAiMjAyMC0wOS0wNyINCiAgICBpbmRleDoNCiAgICAgIHBlcmlvZDogMjRoDQogICAgICBwcmVmaXg6IGxva2lfaW5kZXhfDQogICAgb2JqZWN0X3N0b3JlOiBhd3MNCiAgICBzY2hlbWE6IHYxMQ0KICAgIHN0b3JlOiBib2x0ZGItc2hpcHBlcg0Kc2VydmVyOg0KICBncnBjX2xpc3Rlbl9wb3J0OiA5MDk1DQogIGdycGNfc2VydmVyX21heF9zZW5kX21zZ19zaXplOiA4Mzg4NjA4DQogIGdycGNfc2VydmVyX21heF9yZWN2X21zZ19zaXplOiA4Mzg4NjA4DQogIGh0dHBfbGlzdGVuX3BvcnQ6IDMxMDANCiAgaHR0cF9zZXJ2ZXJfcmVhZF90aW1lb3V0OiA2MHMNCiAgaHR0cF9zZXJ2ZXJfd3JpdGVfdGltZW91dDogNjBzDQogIGxvZ19sZXZlbDogaW5mbw0Kc3RvcmFnZV9jb25maWc6DQogIGF3czoNCiAgICBhY2Nlc3Nfa2V5X2lkOiBHQTgxQ0U2Uk1MQVpaOEVURVpDRw0KICAgIGJ1Y2tldG5hbWVzOiBsb2tpDQogICAgZW5kcG9pbnQ6IGRlbW8tcHJkLWNsdXN0ZXItc3RvcmFnZS1taW5pby1vc3Muc2VydmljZS5kYzAxLmxvY2FsDQogICAgaHR0cF9jb25maWc6DQogICAgICBpZGxlX2Nvbm5fdGltZW91dDogMm0NCiAgICAgIGluc2VjdXJlX3NraXBfdmVyaWZ5OiB0cnVlDQogICAgICByZXNwb25zZV9oZWFkZXJfdGltZW91dDogNW0NCiAgICBpbnNlY3VyZTogZmFsc2UNCiAgICByZWdpb246IHMzX3JlZ2lvbg0KICAgIHMzZm9yY2VwYXRoc3R5bGU6IHRydWUNCiAgICBzZWNyZXRfYWNjZXNzX2tleTogQVFIVWNNTjd6dTZvOXEzTUVCRnlNRzl1ZDQ5TnAyNEkzZUVLYzZyYQ0KICAgIHNzZV9lbmNyeXB0aW9uOiBmYWxzZQ0KICBib2x0ZGJfc2hpcHBlcjoNCiAgICBhY3RpdmVfaW5kZXhfZGlyZWN0b3J5OiAvdmFyL2xva2kvaW5kZXgNCiAgICBjYWNoZV9sb2NhdGlvbjogL3Zhci9sb2tpL2NhY2hlDQogICAgY2FjaGVfdHRsOiAxNjhoDQogICAgc2hhcmVkX3N0b3JlOiBzMw0KICBmaWxlc3lzdGVtOg0KICAgIGRpcmVjdG9yeTogL3Zhci9sb2tpL2NodW5rcw0KICBpbmRleF9jYWNoZV92YWxpZGl0eTogNW0NCiAgaW5kZXhfcXVlcmllc19jYWNoZV9jb25maWc6DQogICAgZW5hYmxlX2ZpZm9jYWNoZTogZmFsc2UNCiAgICBtZW1jYWNoZWQ6DQogICAgICBiYXRjaF9zaXplOiAxMDANCiAgICAgIGV4cGlyYXRpb246IDFoDQogICAgICBwYXJhbGxlbGlzbTogMTAwDQogICAgbWVtY2FjaGVkX2NsaWVudDoNCiAgICAgIGNvbnNpc3RlbnRfaGFzaDogdHJ1ZQ0KICAgICAgaG9zdDogbG9raS1tZW1jYWNoZWQtaW5kZXgtcXVlcmllcw0KICAgICAgbWF4X2lkbGVfY29ubnM6IDE2DQogICAgICBzZXJ2aWNlOiBodHRwDQogICAgICB0aW1lb3V0OiA1cw0KICAgICAgdXBkYXRlX2ludGVydmFsOiAxbQ0KICBtYXhfY2h1bmtfYmF0Y2hfc2l6ZTogMTAwDQphbmFseXRpY3M6DQogIHJlcG9ydGluZ19lbmFibGVkOiBmYWxzZQ=="
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "logging",
                name: "loki",
                chart: "../../_chart/loki-distributed-0.54.1.tgz",
                // repository: "https://grafana.github.io/helm-charts",
                repository: "", // Must be empty string if local chart.
                version: "0.54.1",
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
                            limits: { cpu: "200m", memory: "1024Mi" },
                            requests: { cpu: "200m", memory: "1024Mi" }
                        },
                        persistence: { enabled: true, size: "10Gi", storageClass: "longhorn" }
                    },
                    distributor: {
                        replicas: 2,
                        resources: {
                            limits: { cpu: "200m", memory: "1024Mi" },
                            requests: { cpu: "200m", memory: "1024Mi" }
                        }
                    },
                    querier: {
                        replicas: 2,
                        resources: {
                            limits: { cpu: "200m", memory: "1024Mi" },
                            requests: { cpu: "200m", memory: "1024Mi" }
                        }
                    },
                    queryFrontend: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "512Mi" },
                            requests: { cpu: "200m", memory: "512Mi" }
                        }
                    },
                    gateway: {
                        enabled: true,
                        replicas: 2,
                        verboseLogging: false,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        service: {
                            port: 8080,
                            type: "LoadBalancer",
                            loadBalancerIP: "10.101.4.41",
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
                            limits: { cpu: "200m", memory: "128Mi" },
                            requests: { cpu: "200m", memory: "128Mi" }
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
}