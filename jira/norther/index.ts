import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
  {
    namespace: {
      metadata: {
        name: "jira",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    helm: [
      {
        namespace: "jira",
        name: "jira",
        chart: "jira",
        repository: "https://atlassian.github.io/data-center-helm-charts",
        version: "1.11.0",
        values: {}
      },
      {
        namespace: "jira",
        chart: "mysql",
        repository: "https://charts.bitnami.com/bitnami",
        version: "9.7.0",
        values: {
          image: { tag: "5.7.41-debian-11-r20" },
          architecture: "standalone",
          auth: {
            rootPassword: config.require("rootPassword"),
            createDatabase: true,
            database: "jira",
            username: "jira",
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
            podLabels: { customer: "demo", environment: "dev", project: "developer", group: "jira", datacenter: "dc01", domain: "local" }
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