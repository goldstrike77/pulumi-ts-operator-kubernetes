import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "skywalking",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: {
            metadata: {
                name: "auth-secret",
                namespace: "skywalking",
                annotations: {},
                labels: {}
            },
            type: "Opaque",
            data: {
                auth: Buffer.from("admin:$apr1$sdfvLCI7$L0iMWekg57WuLr7CVFB5f.").toString('base64')
            },
            stringData: {}
        },
        helm: [
            {
                namespace: "skywalking",
                name: "master",
                version: "2.11.0",
                chart: "opensearch",
                repository: "https://opensearch-project.github.io/helm-charts",
                values: {
                    clusterName: "opensearch",
                    nodeGroup: "master",
                    masterService: "opensearch-master",
                    roles: ["master", "ingest", "remote_cluster_client"],
                    replicas: 3,
                    config: {
                        "opensearch.yml": `
        cluster:
          name: opensearch
          max_shards_per_node: 10000
        http:
          compression: false
          cors:
            enabled: true
            allow-origin: "*"
            allow-credentials: true
            allow-methods: HEAD, GET, POST, PUT, DELETE
            allow-headers: "X-Requested-With, X-Auth-Token, Content-Type, Content-Length, Authorization, Access-Control-Allow-Headers, Accept"
        network.host: 0.0.0.0
        plugins:
          security:
            ssl:
              transport:
                pemcert_filepath: esnode.pem
                pemkey_filepath: esnode-key.pem
                pemtrustedcas_filepath: root-ca.pem
                enforce_hostname_verification: false
                resolve_hostname: false
                enabled_protocols:
                  [
                    "TLSv1.2"
                  ]
                enabled_ciphers:
                  [
                    "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
                    "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256",
                    "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA",
                    "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
                    "TLS_RSA_WITH_AES_128_CBC_SHA256",
                    "TLS_RSA_WITH_AES_128_CBC_SHA",
                    "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384",
                    "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384",
                    "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA",
                    "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
                    "TLS_RSA_WITH_AES_256_CBC_SHA256",
                    "TLS_RSA_WITH_AES_256_CBC_SHA",
                  ]
              http:
                enabled: false
            allow_unsafe_democertificates: true
            allow_default_init_securityindex: true
            authcz:
              admin_dn:
                - CN=kirk,OU=client,O=client,L=test,C=de
            audit.type: internal_opensearch
            enable_snapshot_restore_privilege: true
            check_snapshot_restore_write_privileges: true
            restapi:
              roles_enabled: ["all_access", "security_rest_api_access"]
            system_indices:
              enabled: true
              indices:
                [
                  ".opendistro-alerting-config",
                  ".opendistro-alerting-alert*",
                  ".opendistro-anomaly-results*",
                  ".opendistro-anomaly-detector*",
                  ".opendistro-anomaly-checkpoints",
                  ".opendistro-anomaly-detection-state",
                  ".opendistro-reports-*",
                  ".opendistro-notifications-*",
                  ".opendistro-notebooks",
                  ".opendistro-asynchronous-search-response*"
                ]
        `
                    },
                    labels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                    opensearchJavaOpts: "-server -Xmx2048M -Xms2048M",
                    resources: {
                        limits: { cpu: "500m", memory: "3072Mi" },
                        requests: { cpu: "500m", memory: "3072Mi" }
                    },
                    initResources: {
                        limits: { cpu: "25m", memory: "128Mi" },
                        requests: { cpu: "25m", memory: "128Mi" }
                    },
                    persistence: { enabled: true, enableInitChown: false, storageClass: "longhorn", size: "3Gi", },
                    extraInitContainers: [
                        {
                            name: "sysctl",
                            image: "docker.io/bitnami/bitnami-shell:10-debian-10",
                            imagePullPolicy: "IfNotPresent",
                            command: [
                                "/bin/bash",
                                "-ec",
                                "sysctl -w vm.max_map_count=262144;",
                                "sysctl -w fs.file-max=65536;"
                            ],
                            securityContext: { runAsUser: 0, privileged: true }
                        }
                    ],
                    securityConfig: {
                        path: "/usr/share/opensearch/config/opensearch-security",
                        config: {
                            dataComplete: false,
                            data: {
                                "internal_users.yml": `---
        _meta:
          type: "internalusers"
          config_version: 2
        admin:
          hash: "$2a$12$UDizTi1M0bOKPIIjIoE0G.I8zpfsTM1kY8LvcO8lnN8WqjkYDphMe"
          reserved: true
          backend_roles:
          - "admin"
          description: "Demo admin user"
        kibanaserver:
          hash: "$2a$12$Vl4MI3s1r3wFx.LPuklpMOHRayUgoRDCqu3zSz5zbOqFrLo5FVo5."
          reserved: true
          description: "Demo OpenSearch Dashboards user"
        kibanaro:
          hash: "$2a$12$CvASrNE.Elf.4sYBk84u2u5n9Hb/AoiJm4V6IQDxQYZKVN.cO8ixG"
          reserved: false
          backend_roles:
          - "kibanauser"
          - "readall"
          attributes:
            attribute1: "value1"
            attribute2: "value2"
            attribute3: "value3"
          description: "Demo OpenSearch Dashboards read only user"
        logstash:
          hash: "$2a$12$z/cDnBd54GBf0e8pJ53osOfWqc/dnr.P5vU.2BQuNh8VBHAfUoKvm"
          reserved: false
          backend_roles:
          - "logstash"
          description: "Demo logstash user"
        readall:
          hash: "$2a$12$ut60xT.f2SkdJsDV70C2cu6C99xe3d5ASYwTEHlHA6HU7fbhWSWDq"
          reserved: false
          backend_roles:
          - "readall"
          description: "Demo readall user"
        snapshotrestore:
          hash: "$2a$12$WDewkmehCJR8D9MlJziCb.xFmIti7jmtwh/7.qJcwh9s0Fn3JefUC"
          reserved: false
          backend_roles:
          - "snapshotrestore"
          description: "Demo snapshotrestore user"
        `,
                            }
                        }
                    },
                    terminationGracePeriod: "60"
                }
            },
            {
                namespace: "skywalking",
                name: "node",
                version: "2.11.0",
                chart: "opensearch",
                repository: "https://opensearch-project.github.io/helm-charts",
                values: {
                    clusterName: "opensearch",
                    nodeGroup: "data",
                    masterService: "opensearch-master",
                    roles: ["data"],
                    replicas: 2,
                    config: {
                        "opensearch.yml": `
        cluster:
          name: opensearch
          max_shards_per_node: 10000
        http:
          compression: false
          cors:
            enabled: true
            allow-origin: "*"
            allow-credentials: true
            allow-methods: HEAD, GET, POST, PUT, DELETE
            allow-headers: "X-Requested-With, X-Auth-Token, Content-Type, Content-Length, Authorization, Access-Control-Allow-Headers, Accept"
        network.host: 0.0.0.0
        plugins:
          security:
            ssl:
              transport:
                pemcert_filepath: esnode.pem
                pemkey_filepath: esnode-key.pem
                pemtrustedcas_filepath: root-ca.pem
                enforce_hostname_verification: false
                resolve_hostname: false
                enabled_protocols:
                  [
                    "TLSv1.2"
                  ]
                enabled_ciphers:
                  [
                    "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
                    "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256",
                    "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA",
                    "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
                    "TLS_RSA_WITH_AES_128_CBC_SHA256",
                    "TLS_RSA_WITH_AES_128_CBC_SHA",
                    "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384",
                    "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384",
                    "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA",
                    "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
                    "TLS_RSA_WITH_AES_256_CBC_SHA256",
                    "TLS_RSA_WITH_AES_256_CBC_SHA",
                  ]
              http:
                enabled: false
            allow_unsafe_democertificates: true
            allow_default_init_securityindex: true
            authcz:
              admin_dn:
                - CN=kirk,OU=client,O=client,L=test,C=de
            audit.type: internal_opensearch
            enable_snapshot_restore_privilege: true
            check_snapshot_restore_write_privileges: true
            restapi:
              roles_enabled: ["all_access", "security_rest_api_access"]
            system_indices:
              enabled: true
              indices:
                [
                  ".opendistro-alerting-config",
                  ".opendistro-alerting-alert*",
                  ".opendistro-anomaly-results*",
                  ".opendistro-anomaly-detector*",
                  ".opendistro-anomaly-checkpoints",
                  ".opendistro-anomaly-detection-state",
                  ".opendistro-reports-*",
                  ".opendistro-notifications-*",
                  ".opendistro-notebooks",
                  ".opendistro-asynchronous-search-response*"
                ]
        `
                    },
                    labels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                    opensearchJavaOpts: "-server -Xmx6144M -Xms6144M",
                    resources: {
                        limits: { cpu: "2000m", memory: "8192Mi" },
                        requests: { cpu: "2000m", memory: "8192Mi" }
                    },
                    initResources: {
                        limits: { cpu: "25m", memory: "128Mi" },
                        requests: { cpu: "25m", memory: "128Mi" }
                    },
                    persistence: { enabled: true, enableInitChown: false, storageClass: "longhorn", size: "30Gi", },
                    extraInitContainers: [
                        {
                            name: "sysctl",
                            image: "docker.io/bitnami/bitnami-shell:10-debian-10",
                            imagePullPolicy: "IfNotPresent",
                            command: [
                                "/bin/bash",
                                "-ec",
                                "sysctl -w vm.max_map_count=262144;",
                                "sysctl -w fs.file-max=65536;"
                            ],
                            securityContext: { runAsUser: 0, privileged: true }
                        }
                    ],
                    terminationGracePeriod: "60"
                }
            },
            {
                namespace: "skywalking",
                name: "dashboards",
                version: "2.9.0",
                chart: "opensearch-dashboards",
                repository: "https://opensearch-project.github.io/helm-charts",
                values: {
                    opensearchHosts: "http://opensearch-master:9200",
                    replicaCount: 1,
                    fullnameOverride: "opensearch-dashboards",
                    config: {
                        "opensearch_dashboards.yml": `
        ---
        logging.quiet: true
        opensearch.hosts: [http://opensearch-master:9200]
        opensearch.ssl.verificationMode: none
        opensearch.username: kibanaserver
        opensearch.password: ${config.require("kibanaserverPassword")}
        opensearch.requestHeadersWhitelist: [authorization, securitytenant] 
        opensearch_security.multitenancy.enabled: true
        opensearch_security.multitenancy.tenants.preferred: [Private, Global]
        opensearch_security.readonly_mode.roles: [kibana_read_only]
        opensearch_security.cookie.secure: false
        server.host: '0.0.0.0'
        server.rewriteBasePath: true
        server.basePath: "/opensearch"
        `,
                    },
                    labels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                    ingress: {
                        enabled: true,
                        ingressClassName: "nginx",
                        hosts: [
                            {
                                host: "souther.example.com",
                                paths: [
                                    {
                                        path: "/opensearch",
                                        backend: {
                                            serviceName: "opensearch-dashboards",
                                            servicePort: 5601
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    resources: {
                        limits: { cpu: "500m", memory: "512Mi" },
                        requests: { cpu: "500m", memory: "512Mi" }
                    },
                }
            },
            {
                namespace: "skywalking",
                name: "elasticsearch-exporter",
                version: "5.0.0",
                chart: "prometheus-elasticsearch-exporter",
                repository: "https://prometheus-community.github.io/helm-charts",
                values: {
                    fullnameOverride: "opensearch-exporter",
                    log: { level: "wran" },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
                    es: {
                        uri: "http://admin:" + config.require("adminPassword") + "@opensearch-master:9200",
                        all: false,
                        indices: true,
                        indices_settings: true,
                        indices_mappings: true,
                        shards: true,
                        snapshots: true,
                        cluster_settings: true,
                        timeout: "30s",
                        sslSkipVerify: true
                    },
                    serviceMonitor: {
                        enabled: false,
                        interval: "60s",
                        scrapeTimeout: "30s",
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                        ]
                    }
                }
            },
            {
                namespace: "skywalking",
                name: "skywalking",
                chart: "../../_chart/skywalking-4.4.0.tgz",
                repository: "",
                version: "4.4.0",
                values: {
                    oap: {
                        storageType: "elasticsearch",
                        replicas: 2,
                        image: { tag: "9.3.0" },
                        javaOpts: "-Xmx3g -Xms3g",
                        resources: {
                            requests: { cpu: "1000m", memory: "4096Mi" }
                        },
                        env: {
                            SW_STORAGE_ES_CLUSTER_NODES: "opensearch-master:9200",
                            SW_STORAGE_ES_HTTP_PROTOCOL: "http",
                            SW_ES_USER: "admin",
                            SW_ES_PASSWORD: config.require("SW_ES_PASSWORD"),
                            SW_STORAGE_ES_CONNECT_TIMEOUT: "1000",
                            SW_STORAGE_ES_BULK_ACTIONS: "1000", // Execute the async bulk record data every requests.
                            SW_STORAGE_ES_CONCURRENT_REQUESTS: "2", // The number of concurrent requests.
                            SW_STORAGE_ES_INDEX_SHARDS_NUMBER: "2",
                            SW_STORAGE_ES_INDEX_REPLICAS_NUMBER: "1",
                            SW_STORAGE_ES_FLUSH_INTERVAL: "30", // # Flush the bulk every seconds whatever the number of requests.
                            SW_STORAGE_ES_ADVANCED: "{\"index.translog.durability\":\"async\",\"index.translog.sync_interval\":\"30s\"}",
                            SW_CORE_RECORD_DATA_TTL: "3", // Records include traces, logs, topN sampled statements and alarm.
                            SW_CORE_METRICS_DATA_TTL: "7", // Metrics include all metrics for service, instance, endpoint, and topology map.

                        },
                        service: {
                            type: "LoadBalancer",
                            annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
                        }
                    },
                    ui: {
                        replicas: 1,
                        image: { tag: "9.3.0" },
                        ingress: {
                            enabled: true,
                            annotations: {
                                "kubernetes.io/ingress.class": "nginx",
                                "nginx.ingress.kubernetes.io/auth-type": "basic",
                                "nginx.ingress.kubernetes.io/auth-secret": "auth-secret",
                                "nginx.ingress.kubernetes.io/auth-realm": "Authentication Required ",
                            },
                            path: "/",
                            hosts: ["skywalking.souther.example.com"]
                        }
                    },
                    elasticsearch: {
                        enabled: false,
                        config: {
                            port: { http: 9200 },
                            host: "opensearch-master"
                        }
                    },
                    fullnameOverride: "skywalking"
                }
            },
            {
                namespace: "skywalking",
                name: "swck-operator",
                chart: "../../_chart/swck-operator-0.7.0.tgz",
                repository: "",
                version: "0.7.0",
                values: {
                    fullnameOverride: "skywalking",
                    replicas: 1,
                    webhook: {
                        enable: true,
                        oap_service: "http://skywalking-oap.skywalking:12800"
                    },
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
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
    // Create Kubernetes Secret.
    const secret = new k8s.core.v1.Secret(deploy_spec[i].secret.metadata.name, {
        metadata: deploy_spec[i].secret.metadata,
        type: deploy_spec[i].secret.type,
        data: deploy_spec[i].secret.data,
        stringData: deploy_spec[i].secret.stringData
    }, { dependsOn: [namespace] });
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
            }, { dependsOn: [namespace], customTimeouts: { create: "30m" } });
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