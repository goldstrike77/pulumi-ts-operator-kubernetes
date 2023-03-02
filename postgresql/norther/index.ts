import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "postgresql",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "postgresql",
            name: "postgresql",
            chart: "postgresql",
            repository: "https://charts.bitnami.com/bitnami",
            version: "12.2.1",
            values: {
                global: {
                    storageClass: "longhorn",
                    postgresql: {
                        auth: {
                            postgresPassword: config.require("postgresPassword"),
                            username: "user",
                            password: config.require("password"),
                            database: "test"
                        }
                    }
                },
                image: {
                    debug: false
                },
                architecture: "standalone",
                primary: {
                    pgHbaConfiguration: `
local all all trust
host all all localhost trust
host test user 10.244.0.0/16 md5
`,
                    initdb: {
                        user: "user",
                        password: config.require("password"),
                        scripts: {
                            "00_init.sql": `
create table if not exists t_table
(
    id bigint not null primary key,
    name varchar(255),
    description varchar(2000),
    created_time timestamp,
    updated_time timestamp
);
`
                        }
                    },
                    resources: {
                        limits: { cpu: "500m", memory: "512Mi" },
                        requests: { cpu: "500m", memory: "512Mi" }
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "Test", group: "postgresql", datacenter: "dc01", domain: "local" },
                    persistence: {
                        size: "8Gi"
                    }
                },
                volumePermissions: {
                    enabled: true,
                    resources: {
                        limits: { cpu: "50m", memory: "64Mi" },
                        requests: { cpu: "50m", memory: "64Mi" }
                    }
                },
                metrics: {
                    enabled: true,
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    serviceMonitor: {
                        enabled: true,
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                        ]
                    },
                    prometheusRule: {
                        enabled: false,
                        rules: []
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
        skipAwait: true,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    }, { dependsOn: [namespace] });
}