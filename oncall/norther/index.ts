import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "oncall",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "oncall",
                name: "redis",
                chart: "redis",
                repository: "https://charts.bitnami.com/bitnami",
                version: "17.7.1",
                values: {
                    architecture: "standalone",
                    auth: { enabled: false, sentinel: false },
                    commonConfiguration: `appendonly no
maxmemory 256mb
tcp-keepalive 60
tcp-backlog 8192
maxclients 1000
bind 0.0.0.0
databases 4
save ""`,
                    master: {
                        resources: {
                            limits: { cpu: "200m", memory: "320Mi" },
                            requests: { cpu: "200m", memory: "320Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "monitoring", group: "oncall", datacenter: "dc01", domain: "local" },
                        podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "8192" }] },
                        persistence: { enabled: false }
                    },
                    metrics: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "monitoring", group: "oncall", datacenter: "dc01", domain: "local" },
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
                            relabellings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        }
                    },
                    sysctl: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        }
                    }
                }
            },
            {
                namespace: "oncall",
                name: "mysql",
                chart: "mysql",
                repository: "https://charts.bitnami.com/bitnami",
                version: "9.4.8",
                values: {
                    image: { tag: "5.7.41-debian-11-r7" },
                    architecture: "standalone",
                    auth: {
                        rootPassword: config.require("rootPassword"),
                        createDatabase: true,
                        database: "oncall",
                        username: "oncall",
                        password: config.require("userPassword")
                    },
                    primary: {
                        configuration: `
 [mysqld]
 default_authentication_plugin=mysql_native_password
 skip-name-resolve
 explicit_defaults_for_timestamp
 basedir=/opt/bitnami/mysql
 plugin_dir=/opt/bitnami/mysql/lib/plugin
 port=3306
 socket=/opt/bitnami/mysql/tmp/mysql.sock
 datadir=/bitnami/mysql/data
 tmpdir=/opt/bitnami/mysql/tmp
 max_allowed_packet=16M
 bind-address=*
 pid-file=/opt/bitnami/mysql/tmp/mysqld.pid
 log-error=/opt/bitnami/mysql/logs/mysqld.log
 character-set-server=utf8mb4
 collation-server=utf8mb4_general_ci
 slow_query_log=0
 
 [client]
 port=3306
 socket=/opt/bitnami/mysql/tmp/mysql.sock
 default-character-set=UTF8
 plugin_dir=/opt/bitnami/mysql/lib/plugin
 
 [manager]
 port=3306
 socket=/opt/bitnami/mysql/tmp/mysql.sock
 pid-file=/opt/bitnami/mysql/tmp/mysqld.pid
`,
                        resources: {
                            limits: { cpu: "250m", memory: "512Mi" },
                            requests: { cpu: "250m", memory: "512Mi" }
                        },
                        persistence: {
                            enabled: true,
                            storageClass: "longhorn",
                            size: "8Gi"
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "monitoring", group: "oncall", datacenter: "dc01", domain: "local" }
                    },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    metrics: {
                        enabled: true,
                        extraArgs: {
                            primary: ["--tls.insecure-skip-verify", "--collect.auto_increment.columns", "--collect.binlog_size", "--collect.engine_innodb_status", "--collect.global_status", "--collect.global_variables", "--collect.info_schema.clientstats", "--collect.info_schema.innodb_metrics", "--collect.info_schema.innodb_tablespaces", "--collect.info_schema.innodb_cmpmem", "--collect.info_schema.processlist", "--collect.info_schema.query_response_time", "--collect.info_schema.tables", "--collect.info_schema.tablestats", "--collect.info_schema.userstats", "--collect.perf_schema.eventsstatements", "--collect.perf_schema.eventswaits", "--collect.perf_schema.file_events", "--collect.perf_schema.file_instances", "--collect.perf_schema.indexiowaits", "--collect.perf_schema.tableiowaits", "--collect.perf_schema.tablelocks"]
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        livenessProbe: {
                            enabled: true,
                            initialDelaySeconds: 120,
                            periodSeconds: 10,
                            timeoutSeconds: 5,
                            successThreshold: 1,
                            failureThreshold: 3
                        },
                        readinessProbe: {
                            enabled: true,
                            initialDelaySeconds: 30,
                            periodSeconds: 10,
                            timeoutSeconds: 5,
                            successThreshold: 1,
                            failureThreshold: 3
                        },
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
                            relabellings: [
                                { sourceLabels: ["__meta_kubernetes_pod_node_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
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
                            namespace: "",
                            rules: []
                        }
                    }
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