import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const podlabels = {
  customer: "it",
  environment: "prd",
  project: "Logging",
  group: "Loki",
  datacenter: "cn-north",
  domain: "local"
}

const resources = [
  {
    namespace: {
      metadata: {
        name: "logging",
        annotations: {},
        labels: {
          "pod-security.kubernetes.io/enforce": "privileged",
          "pod-security.kubernetes.io/audit": "privileged",
          "pod-security.kubernetes.io/warn": "privileged"
        }
      },
      spec: {}
    },
    release: [
      {
        namespace: "logging",
        name: "loki",
        chart: "loki",
        repositoryOpts: {
          repo: "https://grafana.github.io/helm-charts"
        },
        version: "6.7.3",
        values: {
          global: {
            image: {
              registry: "swr.cn-east-3.myhuaweicloud.com"
            },
            clusterDomain: "cluster.local",
            dnsService: "rke2-coredns-rke2-coredns"
          },
          deploymentMode: "Distributed",
          loki: {
            image: { repository: "docker-io/loki" },
            podLabels: podlabels,
            auth_enabled: false,
            tenants: [],
            limits_config: {
              ingestion_burst_size_mb: 64,
              ingestion_rate_mb: 32,
              ingestion_rate_strategy: "global",
              max_cache_freshness_per_query: "10m",
              max_entries_limit_per_query: 10000,
              max_global_streams_per_user: 100000,
              max_line_size: "64kb",
              max_line_size_truncate: true,
              query_timeout: "300s",
              reject_old_samples: true,
              reject_old_samples_max_age: "120h",
              retention_period: "120h",
              split_queries_by_interval: "15m",
              volume_enabled: true
            },
            "storage": {
              "bucketNames": {
                "chunks": "loki",
                "ruler": "loki",
                "admin": "loki"
              },
              "type": "s3",
              "s3": {
                "endpoint": "obs.home.local:9000",
                "region": "us-east-1",
                "secretAccessKey": config.require("AWS_SECRET_ACCESS_KEY"),
                "accessKeyId": config.require("AWS_ACCESS_KEY_ID"),
                "s3ForcePathStyle": true,
                "insecure": true,
                "http_config": {
                  "idle_conn_timeout": "2m",
                  "insecure_skip_verify": true,
                  "response_header_timeout": "5m"
                }
              }
            },
            "schemaConfig": {
              "configs": [
                {
                  "from": "2024-04-01",
                  "store": "tsdb",
                  "object_store": "s3",
                  "schema": "v13",
                  "index": {
                    "prefix": "loki_index_",
                    "period": "24h"
                  }
                }
              ]
            },
            analytics: { reporting_enabled: false },
            "ingester": { "chunk_encoding": "snappy" },
            "tracing": { "enabled": false },
            "querier": { "max_concurrent": 4 }
          },
          "gateway": {
            "enabled": true,
            "replicas": 1,
            "verboseLogging": false,
            image: { repository: "docker-io/nginx-unprivileged" },
            "podLabels": podlabels,
            "resources": {},
            "service": {
              "port": 80,
              "type": "LoadBalancer",
              "loadBalancerIP": null,
              "annotations": {}
            },
            "basicAuth": {
              "enabled": false,
              "username": null,
              "password": null
            }
          },
          "ingester": {
            "replicas": 3,
            "podLabels": podlabels,
            "resources": {},
            "persistence": {
              "enabled": true,
              "claims": [
                {
                  "name": "data",
                  "size": "7Gi",
                  "storageClass": "vsphere-san-sc"
                }
              ]
            }
          },
          "distributor": {
            "replicas": 3,
            maxUnavailable: 1,
            "podLabels": podlabels,
            "resources": {}
          },
          "querier": {
            "replicas": 1,
            "podLabels": podlabels,
            "resources": {}
          },
          "queryFrontend": {
            "replicas": 1,
            "podLabels": podlabels,
            "resources": {}
          },
          "queryScheduler": {
            "replicas": 1,
            "podLabels": podlabels,
            "resources": {}
          },
          "indexGateway": {
            "replicas": 1,
            "podLabels": podlabels,
            "resources": {}
          },
          "compactor": {
            "replicas": 1,
            "podLabels": podlabels,
            "resources": {},
            "persistence": {
              "enabled": true,
              "size": "7Gi",
              "storageClass": "vsphere-san-sc"
            }
          },
          "bloomGateway": {
            "replicas": 0,
            "podLabels": podlabels,
            "resources": {}
          },
          "bloomCompactor": {
            "replicas": 0,
            "podLabels": podlabels,
            "resources": {}
          },
          "patternIngester": {
            "replicas": 0,
            "podLabels": podlabels,
            "resources": {}
          },
          "ruler": {
            "enabled": false,
            "replicas": 0,
            "podLabels": podlabels,
            "resources": {},
            "directories": {}
          },
          memcached: {
            image: {
              repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/memcached"
            }
          },
          "memcachedExporter": {
            image: { repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/memcached-exporter" },
            resources: {
              limits: { cpu: "200m", memory: "64Mi" },
              requests: { cpu: "200m", memory: "64Mi" }
            }
          },
          "resultsCache": {
            "enabled": true,
            "defaultValidity": "12h",
            "replicas": 1,
            "allocatedMemory": 1024,
            "maxItemMemory": 5,
            "connectionLimit": 16384,
            "writebackSizeLimit": "500MB",
            "writebackBuffer": 500000,
            "writebackParallelism": 1,
            "podLabels": podlabels
          },
          "chunksCache": {
            "enabled": true,
            "batchSize": 4,
            "parallelism": 5,
            "timeout": "2000ms",
            "defaultValidity": "0s",
            "replicas": 1,
            "allocatedMemory": 8192,
            "maxItemMemory": 5,
            "connectionLimit": 16384,
            "writebackSizeLimit": "500MB",
            "writebackBuffer": 500000,
            "writebackParallelism": 1,
            "initContainers": [],
            "podLabels": podlabels
          },
          "sidecar": {
            "resources": {}
          },
          "monitoring": {
            "serviceMonitor": {
              "enabled": true,
              "interval": "15s",
              "relabelings": [
                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
              ],
              "metricsInstance": {
                "enabled": false
              }
            }
          },
          test: { enabled: false },
          lokiCanary: { enabled: false },
          backend: { "replicas": 0 },
          read: { "replicas": 0 },
          write: { "replicas": 0 },
          singleBinary: { "replicas": 0 }
        }
      }
    ]
  }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });