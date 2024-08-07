import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
  {
    namespace: {
      metadata: {
        name: "bitbucket",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    secret: {
      metadata: {
        name: "bitbucket-secret",
        namespace: "bitbucket",
        annotations: {},
        labels: {}
      },
      type: "Opaque",
      data: {
        "dbusername": Buffer.from("bitbucket").toString('base64'),
        "dbpassword": Buffer.from(config.require("dbuserPassword")).toString('base64'),
        "sysadminusername": Buffer.from("admin").toString('base64'),
        "sysadminpassword": Buffer.from(config.require("adminPassword")).toString('base64'),
        "sysadmindisplayName": Buffer.from("admin").toString('base64'),
        "sysadminemailAddress": Buffer.from("admin@example.com").toString('base64'),
        "esusername": Buffer.from("admin").toString('base64'),
        "espassword": Buffer.from(config.require("espassword")).toString('base64'),
      },
      stringData: {}
    },
    helm: [
      {
        namespace: "bitbucket",
        name: "bitbucket",
        chart: "../../_chart/bitbucket-1.12.0.tgz",
        repository: "",
        version: "1.12.0",
        values: {
          replicaCount: 2,
          image: {
            repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/bitbucket",
            tag: "8.9.0"
          },
          database: {
            url: "jdbc:postgresql://postgresql:5432/bitbucket",
            driver: "org.postgresql.Driver",
            credentials: {
              secretName: "bitbucket-secret",
              usernameSecretKey: "dbusername",
              passwordSecretKey: "dbpassword"
            }
          },
          volumes: {
            localHome: {
              persistentVolumeClaim: {
                create: true,
                storageClassName: "longhorn",
                resources: {
                  requests: { storage: "5Gi" }
                }
              }
            },
            sharedHome: {
              persistentVolumeClaim: {
                create: true,
                storageClassName: "nfs-client",
                resources: {
                  requests: { storage: "10Gi" }
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
            path: "/bitbucket"
          },
          bitbucket: {
            service: { contextPath: "/bitbucket" },
            sshService: {
              enabled: true,
              annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
            },
            sysadminCredentials: {
              secretName: "bitbucket-secret",
              usernameSecretKey: "sysadminusername",
              passwordSecretKey: "sysadminpassword",
              displayNameSecretKey: "sysadmindisplayName",
              emailAddressSecretKey: "sysadminemailAddress"
            },
            clustering: { enabled: true },
            elasticSearch: {
              baseUrl: "http://opensearch-master.opensearch:9200",
              credentials: {
                secretName: "bitbucket-secret",
                usernameSecretKey: "esusername",
                passwordSecretKey: "espassword"
              }
            },
            resources: {
              jvm: {
                maxHeap: "4096m",
                minHeap: "4096m"
              },
              container: {
                requests: { cpu: "2000m", memory: "6144Mi" },
                limits: { cpu: "2000m", memory: "6144Mi" }
              }
            }
          },
          podLabels: { customer: "demo", environment: "dev", project: "Developer", group: "Bitbucket", datacenter: "dc01", domain: "local" }
        }
      },
      {
        namespace: "bitbucket",
        name: "postgresql",
        chart: "postgresql",
        repository: "https://charts.bitnami.com/bitnami",
        version: "12.2.6",
        values: {
          global: {
            storageClass: "longhorn",
            postgresql: {
              auth: {
                postgresPassword: config.require("postgresPassword"),
                username: "bitbucket",
                password: config.require("dbuserPassword"),
                database: "bitbucket"
              }
            }
          },
          image: {
            tag: "14.7.0-debian-11-r16"
          },
          architecture: "standalone",
          primary: {
            pgHbaConfiguration: `
local all all trust
host all all localhost trust
host bitbucket bitbucket 10.244.0.0/16 md5
`,
            initdb: {
              user: "bitbucket",
              password: config.require("dbuserPassword"),
            },
            resources: {
              limits: { cpu: "500m", memory: "512Mi" },
              requests: { cpu: "500m", memory: "512Mi" }
            },
            podLabels: { customer: "demo", environment: "dev", project: "Developer", group: "bitbucket", datacenter: "dc01", domain: "local" },
            persistence: {
              size: "8Gi"
            }
          },
          volumePermissions: {
            enabled: true,
            resources: {
              limits: { cpu: "50m", memory: "64Mi" },
              requests: { cpu: "50m", memory: "64Mi" }
            }
          },
          metrics: {
            enabled: true,
            resources: {
              limits: { cpu: "100m", memory: "128Mi" },
              requests: { cpu: "100m", memory: "128Mi" }
            },
            serviceMonitor: {
              enabled: true,
              relabelings: [
                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
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