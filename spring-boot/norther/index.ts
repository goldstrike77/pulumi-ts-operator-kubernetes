import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "spring-boot",
                annotations: {},
                labels: {
                    "swck-injection": "enabled"
                }
            },
            spec: {}
        },
        helm: [
            {
                namespace: "spring-boot",
                name: "mariadb",
                chart: "mariadb",
                repository: "https://charts.bitnami.com/bitnami",
                version: "13.1.3",
                values: {
                    fullnameOverride: "mysql",
                    image: {
                        tag: "10.11.5-debian-11-r47"
                    },
                    architecture: "standalone",
                    auth: {
                        rootPassword: config.require("rootPassword"),
                        createDatabase: true,
                        database: "spring-boot",
                        username: "spring-boot",
                        password: config.require("userPassword")
                    },
                    initdbScripts: {
                        "my_init_script.sh": `
#!/bin/bash
mysql -uroot -p${config.require("rootPassword")} -e "use spring-boot;CREATE TABLE pet (name VARCHAR(20), owner VARCHAR(20), species VARCHAR(20), sex CHAR(1), birth DATE, death DATE);"
mysql -uroot -p${config.require("rootPassword")} -e "use spring-boot;INSERT INTO pet VALUES ('Puffball','Diane','hamster','f','1999-03-30',NULL);"
`
                    },
                    primary: {
                        configuration: `
[mysqld]
skip-log-bin
skip-name-resolve
explicit_defaults_for_timestamp
basedir=/opt/bitnami/mariadb
plugin_dir=/opt/bitnami/mariadb/plugin
port=3306
socket=/opt/bitnami/mariadb/tmp/mysql.sock
tmpdir=/opt/bitnami/mariadb/tmp
max_allowed_packet=16M
bind-address=0.0.0.0
pid-file=/opt/bitnami/mariadb/tmp/mysqld.pid
log-error=/opt/bitnami/mariadb/logs/mysqld.log
character-set-server=UTF8
collation-server=utf8_general_ci
slow_query_log_file=/opt/bitnami/mariadb/logs/mysqld.log
slow_query_log=0
max_connections=100
performance_schema_max_table_instances=256
table_definition_cache=400
table_open_cache=128
innodb_buffer_pool_size=256M
innodb_flush_log_at_trx_commit=2
query_response_time_stats=1
plugin_load_add=query_response_time

[client]
port=3306
socket=/opt/bitnami/mariadb/tmp/mysql.sock
default-character-set=UTF8
plugin_dir=/opt/bitnami/mariadb/plugin

[manager]
port=3306
socket=/opt/bitnami/mariadb/tmp/mysql.sock
pid-file=/opt/bitnami/mariadb/tmp/mysqld.pid
`,
                        extraEnvVars: [
                            { name: "MARIADB_COLLATE", value: "utf8mb4_unicode_ci" },
                            { name: "MARIADB_CHARACTER_SET", value: "utf8mb4" }
                        ],
                        resources: {
                            limits: { cpu: "250m", memory: "512Mi" },
                            requests: { cpu: "250m", memory: "512Mi" }
                        },
                        persistence: {
                            enabled: true,
                            storageClass: "longhorn",
                            size: "7Gi"
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "spring-boot", group: "database", datacenter: "dc01", domain: "local" }
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
                        extraArgs: {
                            primary: [
                                "--collect.auto_increment.columns",
                                "--collect.binlog_size",
                                "--collect.engine_innodb_status",
                                "--collect.global_status",
                                "--collect.global_variables",
                                "--collect.info_schema.clientstats",
                                "--collect.info_schema.innodb_metrics",
                                "--collect.info_schema.innodb_cmp",
                                "--collect.info_schema.innodb_cmpmem",
                                "--collect.info_schema.processlist",
                                "--collect.info_schema.query_response_time",
                                "--collect.info_schema.tables",
                                "--collect.info_schema.tablestats",
                                "--collect.info_schema.schemastats",
                                "--collect.info_schema.userstats",
                                "--collect.perf_schema.eventsstatements",
                                "--collect.perf_schema.eventswaits",
                                "--collect.perf_schema.file_events",
                                "--collect.perf_schema.file_instances",
                                "--collect.perf_schema.indexiowaits",
                                "--collect.perf_schema.tableiowaits",
                                "--collect.perf_schema.tablelocks"
                            ]
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        livenessProbe: {
                            enabled: true,
                            initialDelaySeconds: 120,
                            periodSeconds: 10,
                            timeoutSeconds: 10,
                            successThreshold: 1,
                            failureThreshold: 3
                        },
                        readinessProbe: {
                            enabled: true,
                            initialDelaySeconds: 30,
                            periodSeconds: 10,
                            timeoutSeconds: 10,
                            successThreshold: 1,
                            failureThreshold: 3
                        },
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
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
                            namespace: "",
                            rules: []
                        }
                    }
                }
            },
            {
                namespace: "spring-boot",
                name: "mongodb",
                chart: "mongodb",
                repository: "https://charts.bitnami.com/bitnami",
                version: "13.9.4",
                values: {
                    image: { tag: "4.4.15-debian-10-r8" },
                    architecture: "standalone",
                    replicaCount: 1,
                    auth: { enabled: false },
                    disableSystemLog: true,
                    podLabels: { customer: "demo", environment: "dev", project: "spring-boot", group: "database", datacenter: "dc01", domain: "local" },
                    podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "10000" }] },
                    resources: {
                        limits: { cpu: "1000m", memory: "512Mi" },
                        requests: { cpu: "1000m", memory: "512Mi" }
                    },
                    livenessProbe: { initialDelaySeconds: 60, timeoutSeconds: 30 },
                    readinessProbe: { initialDelaySeconds: 60, timeoutSeconds: 30 },
                    persistence: { enabled: true, storageClass: "longhorn", size: "8Gi" },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        },
                    },
                    arbiter: { enabled: false },
                    metrics: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        },
                        livenessProbe: { initialDelaySeconds: 90, timeoutSeconds: 30 },
                        readinessProbe: { initialDelaySeconds: 90, timeoutSeconds: 30 },
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
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
        ],
        deployment: [
            {
                metadata: {
                    labels: {
                        app: "spring-boot"
                    },
                    name: "spring-boot",
                    namespace: "spring-boot"
                },
                spec: {
                    replicas: 1,
                    selector: {
                        matchLabels: {
                            app: "spring-boot"
                        }
                    },
                    template: {
                        metadata: {
                            labels: {
                                "swck-java-agent-injected": "true",
                                app: "spring-boot",
                                customer: "demo",
                                datacenter: "dc01",
                                domain: "local",
                                environment: "dev",
                                group: "norther",
                                project: "cluster"
                            },
                            annotations: {
                                "strategy.skywalking.apache.org/agent.Overlay": "true",
                                "agent.skywalking.apache.org/agent.service_name": "demo::spring-boot",
                                "agent.skywalking.apache.org/collector.backend_service": "skywalking-oap.skywalking:11800",
                                "sidecar.skywalking.apache.org/initcontainer.Image": "registry.cn-shanghai.aliyuncs.com/goldenimage/skywalking-java-agent:9.0.0-java8",
                                "instrumentation.opentelemetry.io/inject-java": "open-telemetry/instrumentation"
                            }
                        },
                        spec: {
                            containers: [
                                {
                                    image: "registry.cn-hangzhou.aliyuncs.com/goldstrike/spring-boot-kubernetes-mysql:4.2.0",
                                    name: "spring-boot",
                                    livenessProbe: {
                                        failureThreshold: 10,
                                        tcpSocket: {
                                            port: 8778
                                        },
                                        initialDelaySeconds: 60,
                                        periodSeconds: 10,
                                        successThreshold: 1,
                                        timeoutSeconds: 30
                                    },
                                    readinessProbe: {
                                        failureThreshold: 3,
                                        tcpSocket: {
                                            port: 8778
                                        },
                                        initialDelaySeconds: 60,
                                        periodSeconds: 10,
                                        successThreshold: 1,
                                        timeoutSeconds: 10
                                    },
                                    resources: {
                                        limits: { cpu: "300m", memory: "512Mi" },
                                        requests: { cpu: "300m", memory: "512Mi" }
                                    },
                                    ports: [
                                        {
                                            containerPort: 8080,
                                            name: "http",
                                            protocol: "TCP"
                                        },
                                        {
                                            containerPort: 9779,
                                            name: "prometheus",
                                            protocol: "TCP"
                                        },
                                        {
                                            containerPort: 8778,
                                            name: "jolokia",
                                            protocol: "TCP"
                                        }
                                    ],
                                    env: [
                                        { name: "SPRING_DATASOURCE_URL", value: "jdbc:mysql://mysql/spring-boot" },
                                        { name: "SPRING_DATASOURCE_USERNAME", value: "spring-boot" },
                                        { name: "SPRING_DATASOURCE_PASSWORD", value: config.require("userPassword") },
                                        { name: "KUBERNETES_NAMESPACE", value: "spring-boot" },
                                        { name: "HOSTNAME", value: "spring-boot-kubernetes-mysql" }
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            {
                "apiVersion": "apps/v1",
                "kind": "Deployment",
                "metadata": {
                    "name": "knote",
                    namespace: "spring-boot"
                },
                "spec": {
                    "replicas": 1,
                    "selector": {
                        "matchLabels": {
                            "app": "knote"
                        }
                    },
                    "template": {
                        "metadata": {
                            labels: {
                                "swck-java-agent-injected": "true",
                                app: "knote",
                                customer: "demo",
                                datacenter: "dc01",
                                domain: "local",
                                environment: "dev",
                                group: "norther",
                                project: "cluster"
                            },
                            annotations: {
                                "strategy.skywalking.apache.org/agent.Overlay": "true",
                                "agent.skywalking.apache.org/agent.service_name": "demo::knote",
                                "agent.skywalking.apache.org/collector.backend_service": "skywalking-oap.skywalking:11800",
                                "sidecar.skywalking.apache.org/initcontainer.Image": "registry.cn-shanghai.aliyuncs.com/goldenimage/skywalking-java-agent:9.0.0-java11",
                                "instrumentation.opentelemetry.io/inject-java": "open-telemetry/instrumentation"
                            }
                        },
                        "spec": {
                            "containers": [
                                {
                                    "name": "app",
                                    "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/knote-java:1.0.0",
                                    resources: {
                                        limits: { cpu: "300m", memory: "512Mi" },
                                        requests: { cpu: "300m", memory: "512Mi" }
                                    },
                                    "ports": [
                                        {
                                            "containerPort": 8080
                                        }
                                    ],
                                    "env": [
                                        { name: "MONGO_URL", value: "mongodb://mongodb:27017/dev" }
                                    ],
                                    "imagePullPolicy": "Always"
                                }
                            ]
                        }
                    }
                }
            }
        ],
        service: [
            {
                metadata: {
                    labels: {
                        app: "spring-boot"
                    },
                    name: "demo",
                    namespace: "spring-boot"
                },
                spec: {
                    ports: [
                        {
                            name: "spring-boot",
                            port: 8080,
                            protocol: "TCP",
                            targetPort: 8080,
                        }
                    ],
                    selector: {
                        app: "spring-boot",
                    }
                }
            },
            {
                "metadata": {
                    labels: {
                        app: "knote"
                    },
                    "name": "knote",
                    namespace: "spring-boot"
                },
                "spec": {
                    "selector": {
                        "app": "knote"
                    },
                    "ports": [
                        {
                            name: "knote",
                            "port": 8080,
                            protocol: "TCP",
                            "targetPort": 8080
                        }
                    ]
                }
            }
        ],
        route: [
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixRoute",
                metadata: {
                    name: "demo",
                    namespace: "spring-boot"
                },
                spec: {
                    http: [
                        {
                            name: "root",
                            match: {
                                methods: ["GET", "HEAD"],
                                hosts: ["spring-boot.example.com"],
                                paths: ["/*"]
                            },
                            backends: [
                                {
                                    serviceName: "demo",
                                    servicePort: 8080,
                                    resolveGranularity: "service"
                                }
                            ],
                            plugins: [
                                {
                                    name: "limit-conn",
                                    enable: true,
                                    config: {
                                        _meta: {
                                            disable: false
                                        },
                                        allow_degradation: false,
                                        burst: 5,
                                        conn: 20,
                                        default_conn_delay: 2,
                                        key: "remote_addr",
                                        key_type: "var",
                                        only_use_default_delay: false,
                                        rejected_code: 503
                                    }
                                }
                            ]
                        }
                    ]
                }
            },
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixRoute",
                metadata: {
                    name: "knote",
                    namespace: "spring-boot"
                },
                spec: {
                    http: [
                        {
                            name: "root",
                            match: {
                                methods: ["GET", "HEAD"],
                                hosts: ["knote.example.com"],
                                paths: ["/*"]
                            },
                            backends: [
                                {
                                    serviceName: "knote",
                                    servicePort: 8080,
                                    resolveGranularity: "service"
                                }
                            ]
                        }
                    ]
                }
            }
        ]
        /**
                ingress: {
                    metadata: {
                        annotations: {
                            "k8s.apisix.apache.org/http-to-https": "true"
                        },
                        labels: {
                            app: "spring-boot"
                        },
                        name: "spring-boot",
                        namespace: "spring-boot"
                    },
                    spec: {
                        ingressClassName: "ingress",
                        rules: [
                            {
                                host: "spring-boot.example.com",
                                http: {
                                    paths: [
                                        {
                                            backend: {
                                                service: {
                                                    name: "spring-boot",
                                                    port: {
                                                        number: 8080,
                                                    }
                                                }
                                            },
                                            path: "/",
                                            pathType: "Prefix",
                                        }
                                    ]
                                }
                            }
                        ]
                    }       
                }
                 */
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create helm resource.
    for (var helm_index in deploy_spec[i].helm) {
        const helm = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].chart, {
            namespace: deploy_spec[i].helm[helm_index].namespace,
            name: deploy_spec[i].helm[helm_index].chart,
            chart: deploy_spec[i].helm[helm_index].chart,
            version: deploy_spec[i].helm[helm_index].version,
            values: deploy_spec[i].helm[helm_index].values,
            skipAwait: true,
            repositoryOpts: {
                repo: deploy_spec[i].helm[helm_index].repository,
            },
        }, { dependsOn: [namespace], customTimeouts: { create: "30m" } });
    }
    // Create deployment resource.
    for (var deployment_index in deploy_spec[i].deployment) {
        const deployment = new k8s.apps.v1.Deployment(deploy_spec[i].deployment[deployment_index].metadata.name, {
            metadata: deploy_spec[i].deployment[deployment_index].metadata,
            spec: deploy_spec[i].deployment[deployment_index].spec
        }, { dependsOn: [namespace] });
    }
    // Create service resource.
    for (var service_index in deploy_spec[i].service) {
        const service = new k8s.core.v1.Service(deploy_spec[i].service[service_index].metadata.name, {
            metadata: deploy_spec[i].service[service_index].metadata,
            spec: deploy_spec[i].service[service_index].spec
        }, { dependsOn: [namespace] });
    }
    // Create apisix route resource.
    for (var route_index in deploy_spec[i].route) {
        const route = new k8s.apiextensions.CustomResource(deploy_spec[i].route[route_index].metadata.name, {
            apiVersion: deploy_spec[i].route[route_index].apiVersion,
            kind: deploy_spec[i].route[route_index].kind,
            metadata: deploy_spec[i].route[route_index].metadata,
            spec: deploy_spec[i].route[route_index].spec
        }, { dependsOn: [namespace] });
    }
    /**
    // Create Ingress Resource.
    const ingress = new k8s.networking.v1.Ingress(deploy_spec[i].ingress.metadata.name, {
        metadata: deploy_spec[i].ingress.metadata,
        spec: deploy_spec[i].ingress.spec
    }, { dependsOn: [namespace] });
 */
}