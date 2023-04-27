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
    postgresql: {
      kind: "postgresql",
      apiVersion: "acid.zalan.do/v1",
      metadata: {
        name: "postgresql",
        namespace: "confluence",
        labels: {
          team: "devops"
        }
      },
      spec: {
        teamId: "devops",
        postgresql: {
          version: "14"
        },
        numberOfInstances: 1,
        volume: {
          size: "10Gi",
          storageClass: "longhorn"
        },
        users: {
          confluence: []
        },
        databases: {
          confluence: "confluence"
        },
        allowedSourceRanges: ["10.244.0.0/16"],
        resources: {
          limits: { cpu: "500m", memory: "512Mi" },
          requests: { cpu: "500m", memory: "512Mi" }
        }
      }
    },
    helm: {
      namespace: "confluence",
      name: "confluence",
      chart: "../../_chart/confluence-1.12.0.tgz",
      repository: "",
      version: "1.12.0",
      values: {
        replicaCount: 2,
        image: {
          repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/confluence",
          tag: "7.19.7"
        },
        database: {
          type: "postgresql",
          url: "jdbc:postgresql://postgresql:5432/confluence",
          credentials: {
            secretName: "confluence.postgresql.credentials.postgresql.acid.zalan.do"
          }
        },
        volumes: {
          localHome: {
            persistentVolumeClaim: {
              create: true,
              storageClassName: "longhorn",
              resources: {
                requests: {
                  storage: "1Gi"
                }
              }
            }
          },
          sharedHome: {
            persistentVolumeClaim: {
              create: true,
              storageClassName: "nfs-client",
              resources: {
                requests: {
                  storage: "10Gi"
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
          service: {
            contextPath: "/confluence"
          },
          clustering: {
            enabled: true
          },
          resources: {
            jvm: {
              maxHeap: "4096m",
              minHeap: "4096m",
              reservedCodeCache: "256m"
            },
            container: {
              requests: { cpu: "2000m", memory: "6144Mi" },
              limits: { cpu: "4000m", memory: "6144Mi" }
            }
          }
        },
        podLabels: { customer: "demo", environment: "dev", project: "Developer", group: "Confluence", datacenter: "dc01", domain: "local" }
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
  // Create postgresql CRD.
  const postgresql = new k8s.apiextensions.CustomResource(deploy_spec[i].postgresql.metadata.name, {
    name: deploy_spec[i].postgresql.metadata.name,
    metadata: deploy_spec[i].postgresql.metadata,
    apiVersion: deploy_spec[i].postgresql.apiVersion,
    kind: deploy_spec[i].postgresql.kind,
    spec: deploy_spec[i].postgresql.spec,
  }, { dependsOn: [namespace] });
  // Create Release Resource.
  const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
    namespace: deploy_spec[i].helm.namespace,
    name: deploy_spec[i].helm.name,
    chart: deploy_spec[i].helm.chart,
    version: deploy_spec[i].helm.version,
    values: deploy_spec[i].helm.values,
    skipAwait: true,
  }, { dependsOn: [postgresql] });
}