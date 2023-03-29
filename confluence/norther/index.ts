import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
  {
    namespace: {
      metadata: {
        name: "confluence",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    secret: {
      metadata: {
        name: "db-secret",
        namespace: "confluence",
        annotations: {},
        labels: {}
      },
      type: "Opaque",
      data: {
        "username": Buffer.from("confluence").toString('base64'),
        "password": Buffer.from(config.require("userPassword")).toString('base64')
      },
      stringData: {}
    },
    helm: [
      {
        namespace: "confluence",
        name: "confluence",
        chart: "../../_chart/confluence-1.11.0.tgz",
        repository: "",
        version: "1.11.0",
        values: {
          replicaCount: 1,
          database: {
            type: "mysql",
            url: "jdbc:mysql://mysql/confluence",
            credentials: {
              secretName: "db-secret"
            }
          },
          volumes: {
            localHome: {
              persistentVolumeClaim: {
                create: true,
                storageClassName: "longhorn",
                resources: {
                  requests: {
                    storage: "5Gi"
                  }
                }
              }
            }
          },
          ingress: {
            create: true,
            className: "nginx",
            nginx: true,
            maxBodySize: "250m",
            host: "norther.example.com",
            path: "/confluence"
          },
          confluence: {
            resources: {
              jvm: {
                maxHeap: "4g",
                minHeap: "4g",
                reservedCodeCache: "256m"
              }
            },
            container: {
              requests: {
                cpu: "1",
                memory: "6G"
              },
              limits: {
                cpu: "1",
                memory: "6G"
              }
            }
          },
          podLabels: { customer: "demo", environment: "dev", project: "Developer", group: "confluence", datacenter: "dc01", domain: "local" }
        }
      },
      {
        namespace: "confluence",
        name: "mysql",
        chart: "mysql",
        repository: "https://charts.bitnami.com/bitnami",
        version: "9.7.0",
        values: {
          image: { tag: "5.7.41-debian-11-r20" },
          architecture: "standalone",
          auth: {
            rootPassword: config.require("rootPassword"),
            createDatabase: true,
            database: "confluence",
            username: "confluence",
            password: config.require("userPassword")
          },
          primary: {
            resources: {
              limits: { cpu: "250m", memory: "512Mi" },
              requests: { cpu: "250m", memory: "512Mi" }
            },
            persistence: {
              enabled: true,
              storageClass: "longhorn",
              size: "8Gi"
            },
            podLabels: { customer: "demo", environment: "dev", project: "Developer", group: "confluence", datacenter: "dc01", domain: "local" }
          },
          volumePermissions: {
            enabled: false,
            resources: {
              limits: { cpu: "100m", memory: "128Mi" },
              requests: { cpu: "100m", memory: "128Mi" }
            }
          },
          metrics: {
            enabled: false,
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