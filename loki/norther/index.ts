import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

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
    helm: [
      {
        namespace: "logging",
        name: "loki",
        chart: "loki-distributed",
        repository: "https://grafana.github.io/helm-charts",
        version: "0.67.0",
        values: {
          nameOverride: "loki",
          loki: {
            podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
            config: `
auth_enabled: false
chunk_store_config:
  chunk_cache_config:
    enable_fifocache: false
    memcached:
      batch_size: 100
      expiration: 1h
      parallelism: 100
    memcached_client:
      consistent_hash: true
      host: {{ include "loki.memcachedChunksFullname" . }}
      max_idle_conns: 16
      service: memcached-client
      timeout: 5s
      update_interval: 1m
  max_look_back_period: 0s
compactor:
  compaction_interval: 2h
  retention_delete_delay: 2h
  retention_delete_worker_count: 150
  retention_enabled: true
  shared_store: s3
  working_directory: /var/loki/compactor
distributor:
  ring:
    kvstore:
      store: memberlist
frontend:
  compress_responses: true
  log_queries_longer_than: 5s
  tail_proxy_url: http://loki-querier:3100
frontend_worker:
  frontend_address: loki-query-frontend:9095
  parallelism: 10
ingester:
  chunk_block_size: 32768
  chunk_encoding: snappy
  chunk_idle_period: 30m
  chunk_retain_period: 1m
  lifecycler:
    ring:
      kvstore:
        store: memberlist
      replication_factor: 2
  max_transfer_retries: 0
  wal:
    dir: /var/loki/wal
limits_config:
  enforce_metric_name: false
  ingestion_burst_size_mb: 64
  ingestion_rate_mb: 32
  ingestion_rate_strategy: global
  max_cache_freshness_per_query: 10m
  max_entries_limit_per_query: 10000
  max_global_streams_per_user: 100000
  max_line_size: 32kb
  max_line_size_truncate: true
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  retention_period: 120h
  split_queries_by_interval: 15m
memberlist:
  join_members:
  - loki-memberlist
querier:
  max_concurrent: 30
  query_store_only: false
  query_timeout: 60s
query_range:
  align_queries_with_step: true
  cache_results: true
  max_retries: 5
  results_cache:
    cache:
      memcached_client:
        consistent_hash: true
        host: {{ include "loki.memcachedFrontendFullname" . }}
        max_idle_conns: 16
        service: memcached-client
        timeout: 5s
        update_interval: 1m
ruler:
  alertmanager_url: https://alertmanager.xx
  external_url: https://alertmanager.xx
  ring:
    kvstore:
      store: memberlist
  rule_path: /tmp/loki/scratch
  storage:
    local:
      directory: /etc/loki/rules
    type: local
runtime_config:
  file: /var/loki-runtime/runtime.yaml
schema_config:
  configs:
  - chunks:
      period: 24h
      prefix: loki_chunk_
    from: "2020-09-07"
    index:
      period: 24h
      prefix: loki_index_
    object_store: aws
    schema: v11
    store: boltdb-shipper
server:
  grpc_listen_port: 9095
  grpc_server_max_send_msg_size: 327680000
  grpc_server_max_recv_msg_size: 327680000
  http_listen_port: 3100
  http_server_read_timeout: 60s
  http_server_write_timeout: 60s
  log_level: info
storage_config:
  aws:
    access_key_id: ${config.require("AWS_ACCESS_KEY_ID")}
    bucketnames: loki
    endpoint: minio.minio.svc.cluster.local:9000
    http_config:
      idle_conn_timeout: 2m
      insecure_skip_verify: true
      response_header_timeout: 5m
    insecure: true
    region: s3_region
    s3forcepathstyle: true
    secret_access_key: ${config.require("AWS_SECRET_ACCESS_KEY")}
    sse_encryption: false
  boltdb_shipper:
    active_index_directory: /var/loki/index
    cache_location: /var/loki/cache
    cache_ttl: 168h
    shared_store: s3
  filesystem:
    directory: /var/loki/chunks
  index_cache_validity: 5m
  index_queries_cache_config:
    enable_fifocache: false
    memcached:
      batch_size: 100
      expiration: 1h
      parallelism: 100
    memcached_client:
      consistent_hash: true
      host: {{ include "loki.memcachedIndexQueriesFullname" . }}
      max_idle_conns: 16
      service: memcached-client
      timeout: 5s
      update_interval: 1m
  max_chunk_batch_size: 100
analytics:
  reporting_enabled: false
`
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
            maxUnavailable: 1,
            resources: {
              limits: { cpu: "200m", memory: "512Mi" },
              requests: { cpu: "200m", memory: "512Mi" }
            },
            persistence: { enabled: true, size: "10Gi", storageClass: "nfs-client" }
          },
          distributor: {
            replicas: 2,
            maxUnavailable: 1,
            resources: {
              limits: { cpu: "200m", memory: "128Mi" },
              requests: { cpu: "200m", memory: "128Mi" }
            }
          },
          querier: {
            replicas: 2,
            maxUnavailable: 1,
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
            maxUnavailable: 1,
            verboseLogging: false,
            resources: {
              limits: { cpu: "200m", memory: "128Mi" },
              requests: { cpu: "200m", memory: "128Mi" }
            },
            service: {
              port: 8080,
              type: "LoadBalancer",
              annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
            }
          },
          compactor: {
            enabled: true,
            resources: {
              limits: { cpu: "200m", memory: "256Mi" },
              requests: { cpu: "200m", memory: "256Mi" }
            },
            persistence: { enabled: true, size: "8Gi", storageClass: "nfs-client" }
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