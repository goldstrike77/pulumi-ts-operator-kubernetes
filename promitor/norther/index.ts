import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
  {
    namespace: {
      metadata: {
        name: "promitor",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    helm: {
      namespace: "promitor",
      name: "promitor",
      chart: "promitor-agent-resource-discovery",
      repository: "https://charts.promitor.io",
      version: "0.9.0",
      values: {
        replicaCount: 1,
        image: {
          repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/promitor-agent-resource-discovery",
          pullPolicy: "IfNotPresent",
          tag: "0.9.0"
        },
        azureAuthentication: {
          mode: "ServicePrincipal",
          identity: {
            id: "xxxxxxxxxxx",
            key: "xxxxxxxxxxxx"
          }
        },
        prometheus: {
          serviceMonitor: {
            enabled: true,
            labels: {},
            interval: "60s",
            timeout: "30s"
          }
        },
        azureLandscape: {
          cloud: "China",
          tenantId: "xxxxxxxxxxxxxxx",
          subscriptions: ["xxxxxxxxxxxxxxxxxx"]
        },
        resourceDiscoveryGroups: [
          {
            name: "mysql-database-landscape",
            type: "MySql",
            criteria: {
              include: {
                regions: ["chinanorth2"]
              }
            }
          },
          {
            name: "postgres-database-landscape",
            type: "PostgreSql",
            criteria: {
              include: {
                regions: ["chinanorth2"]
              }
            }
          }
        ],
        deployment: {
          env: {
            extra: [
              { name: "PROMITOR_LOGGING_MINIMUMLEVEL", value: "Error" },
              { name: "PROMITOR_LOGGING_MINIMUMLOGLEVEL", value: "Error" }
            ]
          }
        },
        podLabels: { customer: "demo", environment: "dev", project: "Monitor", group: "promitor", datacenter: "dc01", domain: "local" },
        resources: {
          requests: { cpu: "300m", memory: "128Mi" },
          limits: { cpu: "300m", memory: "128Mi" }
        },
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
  // Create Release Resource.
  const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
    namespace: deploy_spec[i].helm.namespace,
    name: deploy_spec[i].helm.name,
    chart: deploy_spec[i].helm.chart,
    version: deploy_spec[i].helm.version,
    values: deploy_spec[i].helm.values,
    skipAwait: true,
    repositoryOpts: {
      repo: deploy_spec[i].helm.repository,
    },
  }, { dependsOn: [namespace] });
}