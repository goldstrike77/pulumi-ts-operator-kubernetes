import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
  {
    namespace: {
      metadata: {
        name: "ingress-kong",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    helm: {
      namespace: "ingress-kong",
      name: "kong",
      chart: "kong",
      repository: "https://charts.konghq.com",
      version: "2.17.0",
      values: {
        fullnameOverride: "kong",
        env: {
          database: "off",
          nginx_worker_processes: "1"
        },
        admin: {
          enabled: true,
          type: "LoadBalancer",
          annotations: { "metallb.universe.tf/allow-shared-ip": "kong" },
        },
        proxy: {
          enabled: true,
          type: "LoadBalancer",
          annotations: { "metallb.universe.tf/allow-shared-ip": "kong" },
          tls: {
            parameters: ["http2", "reuseport", "backlog=16384"]
          }
        },
        migrations: {
          resources: {
            limits: { cpu: "100m", memory: "128Mi" },
            requests: { cpu: "100m", memory: "128Mi" }
          }
        },
        ingressController: {
          ingressClass: "kong",
          resources: {
            limits: { cpu: "200m", memory: "256Mi" },
            requests: { cpu: "200m", memory: "256Mi" }
          }
        },
        resources: {
          limits: { cpu: "1000m", memory: "1024Mi" },
          requests: { cpu: "1000m", memory: "1024Mi" }
        },
        podLabels: { customer: "demo", environment: "dev", project: "API-Gateway", group: "Kong", datacenter: "dc01", domain: "local" },
        replicaCount: 1,
        serviceMonitor: {
          enabled: true,
          interval: "60s",
          labels: { customer: "demo", environment: "dev", project: "API-Gateway", group: "Kong", datacenter: "dc01", domain: "local" }
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