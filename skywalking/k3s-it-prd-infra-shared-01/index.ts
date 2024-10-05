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
          labels: {}
        },
        spec: {}
      }
    ],
    release: [
      {
        namespace: "skywalking",
        name: "opensearch",
        version: "2.24.0",
        chart: "opensearch",
        repositoryOpts: {
          repo: "https://opensearch-project.github.io/helm-charts"
        },
        values: {
          clusterName: "opensearch",
          nodeGroup: "master",
          replicas: 1,
          config: {
            "opensearch.yml": `---
cluster:
  name: opensearch-cluster
  max_shards_per_node: 10000
network:
  host: 0.0.0.0
http:
  compression: false
  cors:
    enabled: true
    allow-origin: "*"
    allow-credentials: true
    allow-methods: HEAD, GET, POST, PUT, DELETE
    allow-headers: "X-Requested-With, X-Auth-Token, Content-Type, Content-Length, Authorization, Access-Control-Allow-Headers, Accept"
plugins:
  security:
    ssl:
      transport:
        pemcert_filepath: esnode.pem
        pemkey_filepath: esnode-key.pem
        pemtrustedcas_filepath: root-ca.pem
        enforce_hostname_verification: false
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
          extraEnvs: [
            {
              name: "OPENSEARCH_INITIAL_ADMIN_PASSWORD",
              value: config.require("adminPassword")
            }
          ],
          image: {
            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/opensearch",
            tag: "2.16.0-s3"
          },
          labels: podlabels,
          opensearchJavaOpts: "-server -Xmx4096M -Xms4096M",
          resources: {
            limits: { cpu: "1000m", memory: "6144Mi" },
            requests: { cpu: "1000m", memory: "6144Mi" }
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
            storageClass: "local-path",
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
          startupProbe: {
            initialDelaySeconds: 120,
            periodSeconds: 30,
            timeoutSeconds: 3,
            failureThreshold: 30
          },
          serviceMonitor: { enabled: false }
        }
      },
      {
        namespace: "skywalking",
        name: "skywalking",
        chart: "../../_chart/skywalking-4.6.0.tgz",
        version: "4.6.0",
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
              SW_STORAGE_ES_INDEX_REPLICAS_NUMBER: "0",
              SW_STORAGE_ES_INDEX_SHARDS_NUMBER: "1",
              SW_STORAGE_ES_QUERY_MAX_SIZE: "10000",
              SW_STORAGE_ES_QUERY_MAX_WINDOW_SIZE: "10000",
              SW_STORAGE_ES_RESPONSE_TIMEOUT: "10000",
              SW_TELEMETRY: "prometheus",
              SW_ZIPKIN_SAMPLE_RATE: "10000",
              SW_ZIPKIN_SEARCHABLE_TAG_KEYS: "http.method"
            },
            service: { type: "LoadBalancer" },
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
            ingress:
            {
              enabled: true,
              annotations: {
                "kubernetes.io/ingress.class": "traefik"
              },
              hosts: ["skywalking.home.local"]
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
      }
    ],
  }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });