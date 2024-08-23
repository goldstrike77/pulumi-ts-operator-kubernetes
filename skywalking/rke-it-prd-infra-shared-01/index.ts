import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const podlabels = {
  customer: "it",
  environment: "prd",
  project: "APM",
  group: "SkyWalking",
  datacenter: "cn-north",
  domain: "local"
}

const resources = [
  {
    namespace: [
      {
        metadata: {
          name: "skywalking",
          annotations: {},
          labels: {
            "pod-security.kubernetes.io/enforce": "privileged",
            "pod-security.kubernetes.io/audit": "privileged",
            "pod-security.kubernetes.io/warn": "privileged"
          }
        },
        spec: {}
      }
    ],
    release: [
      {
        namespace: "skywalking",
        name: "opensearch",
        version: "2.16.1",
        chart: "opensearch",
        repositoryOpts: {
          repo: "https://opensearch-project.github.io/helm-charts"
        },
        values: {
          clusterName: "opensearch",
          nodeGroup: "master",
          masterService: "opensearch-master",
          replicas: 1,
          config: {
            "opensearch.yml": `---
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
      indices: [".opendistro-alerting-config",".opendistro-alerting-alert*",".opendistro-anomaly-results*",".opendistro-anomaly-detector*",".opendistro-anomaly-checkpoints",".opendistro-anomaly-detection-state",".opendistro-reports-*",".opendistro-notifications-*",".opendistro-notebooks",".opendistro-asynchronous-search-response*"]
`
          },
          image: {
            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/opensearch",
            tag: "2.11.1"
          },
          labels: podlabels,
          opensearchJavaOpts: "-server -Xmx6144M -Xms6144M",
          resources: {
            limits: { cpu: "1000m", memory: "8196Mi" },
            requests: { cpu: "1000m", memory: "8196Mi" }
          },
          initResources: {
            limits: { cpu: "200m", memory: "128Mi" },
            requests: { cpu: "200m", memory: "128Mi" }
          },
          persistence: {
            enabled: true,
            enableInitChown: true,
            image: "swr.cn-east-3.myhuaweicloud.com/docker-io/busybox",
            imageTag: "1.36.1",
            storageClass: "vsphere-san-sc",
            size: "31Gi"
          },
          extraInitContainers: [
            {
              name: "sysctl",
              image: "swr.cn-east-3.myhuaweicloud.com/docker-io/os-shell:12-debian-12-r22",
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
  hash: "$2y$12$efArm1EkVRnZYTk4upm/aerIq5g/3vvtQnGWF1D9JOd48byXVQFMm"
  reserved: true
  backend_roles:
  - "admin"
  description: "Demo admin user"
kibanaserver:
  hash: "$2y$12$efArm1EkVRnZYTk4upm/aerIq5g/3vvtQnGWF1D9JOd48byXVQFMm"
  reserved: true
  description: "Demo OpenSearch Dashboards user"
kibanaro:
  hash: "$2y$12$efArm1EkVRnZYTk4upm/aerIq5g/3vvtQnGWF1D9JOd48byXVQFMm"
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
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
  reserved: false
  backend_roles:
  - "logstash"
  description: "Demo logstash user"
readall:
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
  reserved: false
  backend_roles:
  - "readall"
  description: "Demo readall user"
snapshotrestore:
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
  reserved: false
  backend_roles:
  - "snapshotrestore"
  description: "Demo snapshotrestore user"
`
              }
            }
          },
          terminationGracePeriod: "60",
          fullnameOverride: "skywalking-opensearch-master"
        }
      },
      {
        namespace: "skywalking",
        name: "elasticsearch-exporter",
        version: "5.8.0",
        chart: "prometheus-elasticsearch-exporter",
        repositoryOpts: {
          repo: "https://prometheus-community.github.io/helm-charts"
        },
        values: {
          fullnameOverride: "skywalking-opensearch-exporter",
          log: { level: "wran" },
          resources: {
            limits: { cpu: "100m", memory: "64Mi" },
            requests: { cpu: "100m", memory: "64Mi" }
          },
          podLabels: podlabels,
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
            enabled: true,
            interval: "60s",
            scrapeTimeout: "30s",
            relabelings: [
              { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
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
        chart: "../../_chart/skywalking-4.5.0.tgz",
        version: "4.5.0",
        values: {
          initContainer: {
            image: "swr.cn-east-3.myhuaweicloud.com/docker-io/busybox",
            tag: '1.36.1'
          },
          oap: {
            storageType: "elasticsearch",
            replicas: 1,
            ports: {
              zipkin: 9411,
              grpc: 11800,
              rest: 12800,
              "prometheus-port": 1234,
              promql: "9090"
            },
            image: {
              repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/skywalking-oap-server",
              tag: "10.0.0"
            },
            javaOpts: "-Xmx4g -Xms4g",
            resources: {
              requests: { cpu: "1000m", memory: "6144Mi" },
              limits: { cpu: "4000m", memory: "6144Mi" },
            },
            startupProbe: {
              tcpSocket: { port: 12800 },
              failureThreshold: 30,
              periodSeconds: 10
            },
            env: {
              SW_CORE_METRICS_DATA_TTL: "7",
              SW_CORE_RECORD_DATA_TTL: "3",
              SW_ES_PASSWORD: config.require("adminPassword"),
              SW_ES_USER: "admin",
              SW_OTEL_RECEIVER: "default",
              SW_OTEL_RECEIVER_ENABLED_OTEL_RULES: "oap",
              SW_PROMQL_REST_CONTEXT_PATH: "/",
              SW_PROMQL_REST_HOST: "0.0.0.0",
              SW_PROMQL_REST_IDLE_TIMEOUT: "30000",
              SW_PROMQL_REST_MAX_THREADS: "200",
              SW_PROMQL_REST_PORT: "9090",
              SW_PROMQL_REST_QUEUE_SIZE: "0",
              SW_RECEIVER_ZIPKIN: "default",
              SW_RECEIVER_ZIPKIN_REST_CONTEXT_PATH: "/",
              SW_RECEIVER_ZIPKIN_REST_HOST: "0.0.0.0",
              SW_RECEIVER_ZIPKIN_REST_IDLE_TIMEOUT: "30000",
              SW_RECEIVER_ZIPKIN_REST_MAX_THREADS: "200",
              SW_RECEIVER_ZIPKIN_REST_PORT: "9411",
              SW_RECEIVER_ZIPKIN_REST_QUEUE_SIZE: "0",
              SW_STORAGE_ES_BULK_ACTIONS: "1000",
              SW_STORAGE_ES_CLUSTER_NODES: "opensearch-master:9200",
              SW_STORAGE_ES_CONCURRENT_REQUESTS: "2",
              SW_STORAGE_ES_CONNECT_TIMEOUT: "5000",
              SW_STORAGE_ES_FLUSH_INTERVAL: "30",
              SW_STORAGE_ES_HTTP_PROTOCOL: "http",
              SW_STORAGE_ES_INDEX_REPLICAS_NUMBER: "1",
              SW_STORAGE_ES_INDEX_SHARDS_NUMBER: "2",
              SW_STORAGE_ES_QUERY_MAX_SIZE: "10000",
              SW_STORAGE_ES_QUERY_MAX_WINDOW_SIZE: "10000",
              SW_STORAGE_ES_RESPONSE_TIMEOUT: "10000",
              SW_TELEMETRY: "prometheus",
              SW_ZIPKIN_SAMPLE_RATE: "10000",
              SW_ZIPKIN_SEARCHABLE_TAG_KEYS: "http.method"
            },
            service: {
              type: "LoadBalancer",
              annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
            },
            dynamicConfig: {
              enabled: true,
              config: {
                "alarm.default.alarm-settings": `
rules:
  service_resp_time_rule:
    metrics-name: service_resp_time
    op: ">"
    threshold: 1000
    period: 10
    count: 3
    silence-period: 10
    message: Response time of service {name} is more than 1000ms in 3 minutes of last 10 minutes.
  service_sla_rule:
    metrics-name: service_sla
    op: "<"
    threshold: 8500
    period: 10
    count: 3
    silence-period: 10
    message: Successful rate of service {name} is lower than 80% in 3 minutes of last 10 minutes
  service_resp_time_percentile_rule:
    # Metrics value need to be long, double or int
    metrics-name: service_percentile
    op: ">"
    threshold: 1000,1000,1000,1000,1000
    period: 10
    count: 3
    silence-period: 10
    message: Percentile response time of service {name} alarm in 3 minutes of last 10 minutes, due to more than one condition of p50 > 1000, p75 > 1000, p90 > 1000, p95 > 1000, p99 > 1000
  service_instance_resp_time_rule:
    metrics-name: service_instance_resp_time
    op: ">"
    threshold: 1000
    period: 10
    count: 3
    silence-period: 10
    message: Response time of service instance {name} is more than 1000ms in 3 minutes of last 10 minutes
  database_access_resp_time_rule:
    metrics-name: database_access_resp_time
    threshold: 1000
    op: ">"
    period: 10
    count: 3
    silence-period: 10
    message: Response time of database access {name} is more than 1000ms in 3 minutes of last 10 minutes
  endpoint_relation_resp_time_rule:
    metrics-name: endpoint_relation_resp_time
    threshold: 1000
    op: ">"
    period: 10
    count: 3
    silence-period: 10
    message: Response time of endpoint relation {name} is more than 1000ms in 3 minutes of last 10 minutes
webhooks:
  - http://oncall-engine.oncall:8080/integrations/v1/webhook/lLKrRPAenb9wtZcLaOKTn82M2/
`
              }
            }
          },
          ui: {
            replicas: 1,
            image: {
              repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/skywalking-ui",
              tag: "10.0.0"
            },
            resources: {
              requests: { cpu: "500m", memory: "1024Mi" },
              limits: { cpu: "500m", memory: "1024Mi" },
            },
            ingress: { enabled: false }
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
      /**
            {
              namespace: "skywalking",
              name: "swck-operator",
              chart: "../../_chart/swck-operator-0.8.0.tgz",
              version: "0.8.0",
              values: {
                fullnameOverride: "skywalking",
                replicas: 1,
                resources: {
                  limits: { cpu: "200m", memory: "256Mi" },
                  requests: { cpu: "200m", memory: "256Mi" }
                }
              }
            }
       */
    ],
    customresource: [
      {
        apiVersion: "monitoring.coreos.com/v1",
        kind: "ServiceMonitor",
        metadata: {
          name: "skywalking",
          namespace: "skywalking"
        },
        spec: {
          endpoints: [
            {
              interval: "60s",
              path: "/metrics",
              scheme: "http",
              port: "prometheus-port",
              relabelings: [
                { action: "replace", replacement: "demo", sourceLabels: ["__address__"], targetLabel: "customer" },
                { action: "replace", replacement: "dev", sourceLabels: ["__address__"], targetLabel: "environment" },
                { action: "replace", replacement: "APM", sourceLabels: ["__address__"], targetLabel: "project" },
                { action: "replace", replacement: "Skywalking", sourceLabels: ["__address__"], targetLabel: "group" },
                { action: "replace", replacement: "dc01", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
              ]
            }
          ],
          jobLabel: "skywalking-oap",
          namespaceSelector: {
            matchNames: ["skywalking"]
          },
          selector: {
            matchLabels: {
              app: "skywalking",
              component: "oap"
            }
          }
        }
      },
      {
        apiVersion: "apisix.apache.org/v2",
        kind: "ApisixRoute",
        metadata: {
          name: "skywalking-ui",
          namespace: "skywalking"
        },
        spec: {
          http: [
            {
              name: "root",
              match: {
                methods: ["GET", "HEAD", "POST"],
                hosts: ["skywalking.home.local"],
                paths: ["/*"]
              },
              backends: [
                {
                  serviceName: "skywalking-ui",
                  servicePort: 80,
                  resolveGranularity: "service"
                }
              ],
              plugins: [
                {
                  name: "basic-auth",
                  enable: true
                }
              ]
            }
          ]
        }
      },
      {
        apiVersion: "apisix.apache.org/v2",
        kind: "ApisixConsumer",
        metadata: {
          name: "skywalking-ui-auth",
          namespace: "skywalking"
        },
        spec: {
          authParameter: {
            basicAuth: {
              value: {
                username: "admin",
                password: config.require("skywalkingPassword")
              }
            }
          }
        }
      }
    ]
  }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [release] });