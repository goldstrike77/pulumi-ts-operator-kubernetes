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
        name: "opensearch-secret",
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
        name: "opensearch",
        version: "2.15.0",
        chart: "opensearch",
        repository: "https://opensearch-project.github.io/helm-charts",
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
          labels: { customer: "demo", environment: "dev", project: "APM", group: "Opensearch", datacenter: "dc01", domain: "local" },
          opensearchJavaOpts: "-server -Xmx6144M -Xms6144M",
          resources: {
            limits: { cpu: "1000m", memory: "8196Mi" },
            requests: { cpu: "1000m", memory: "8196Mi" }
          },
          initResources: {
            limits: { cpu: "200m", memory: "128Mi" },
            requests: { cpu: "200m", memory: "128Mi" }
          },
          persistence: { enabled: true, enableInitChown: true, storageClass: "longhorn", size: "30Gi", },
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
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
  reserved: true
  backend_roles:
  - "admin"
  description: "Demo admin user"
kibanaserver:
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
  reserved: true
  description: "Demo OpenSearch Dashboards user"
kibanaro:
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
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
          terminationGracePeriod: "60"
        }
      },
      {
        namespace: "skywalking",
        name: "elasticsearch-exporter",
        version: "5.3.0",
        chart: "prometheus-elasticsearch-exporter",
        repository: "https://prometheus-community.github.io/helm-charts",
        values: {
          fullnameOverride: "opensearch-exporter",
          log: { level: "wran" },
          resources: {
            limits: { cpu: "100m", memory: "64Mi" },
            requests: { cpu: "100m", memory: "64Mi" }
          },
          podLabels: { customer: "demo", environment: "dev", project: "APM", group: "Opensearch", datacenter: "dc01", domain: "local" },
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
        repository: "",
        version: "4.5.0",
        values: {
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
            image: { tag: "9.6.0" },
            javaOpts: "-Xmx3g -Xms3g",
            resources: {
              requests: { cpu: "1000m", memory: "4096Mi" },
              limits: { cpu: "4000m", memory: "4096Mi" },
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
            image: { tag: "9.6.0" },
            resources: {
              requests: { cpu: "500m", memory: "1024Mi" },
              limits: { cpu: "500m", memory: "1024Mi" },
            },
            ingress: {
              enabled: true,
              annotations: {
                "kubernetes.io/ingress.class": "nginx",
                "nginx.ingress.kubernetes.io/auth-type": "basic",
                "nginx.ingress.kubernetes.io/auth-secret": "opensearch-secret",
                "nginx.ingress.kubernetes.io/auth-realm": "Authentication Required ",
              },
              path: "/",
              hosts: ["skywalking.example.com"]
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
          resources: {
            limits: { cpu: "200m", memory: "256Mi" },
            requests: { cpu: "200m", memory: "256Mi" }
          }
        }
      }
    ],
    servicemonitor: {
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
    }
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
  // Create service monitor.
  const ingressclass = new k8s.apiextensions.CustomResource(deploy_spec[i].servicemonitor.metadata.name, {
    apiVersion: deploy_spec[i].servicemonitor.apiVersion,
    kind: deploy_spec[i].servicemonitor.kind,
    metadata: deploy_spec[i].servicemonitor.metadata,
    spec: deploy_spec[i].servicemonitor.spec
  }, { dependsOn: [namespace] });
}