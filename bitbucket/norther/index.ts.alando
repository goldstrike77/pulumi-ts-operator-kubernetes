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
        "sysadminusername": Buffer.from("admin").toString('base64'),
        "sysadminpassword": Buffer.from(config.require("adminPassword")).toString('base64'),
        "sysadmindisplayName": Buffer.from("admin").toString('base64'),
        "sysadminemailAddress": Buffer.from("admin@example.com").toString('base64'),
        "esusername": Buffer.from("admin").toString('base64'),
        "espassword": Buffer.from(config.require("espassword")).toString('base64'),
      },
      stringData: {}
    },
    postgresql: {
      kind: "postgresql",
      apiVersion: "acid.zalan.do/v1",
      metadata: {
        name: "postgresql",
        namespace: "bitbucket",
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
          bitbucket: []
        },
        databases: {
          bitbucket: "bitbucket"
        },
        allowedSourceRanges: ["10.244.0.0/16"],
        resources: {
          limits: { cpu: "500m", memory: "512Mi" },
          requests: { cpu: "500m", memory: "512Mi" }
        }
      }
    },
    helm: {
      namespace: "bitbucket",
      name: "bitbucket",
      chart: "../../_chart/bitbucket-1.12.0.tgz",
      repository: "",
      version: "1.12.0",
      values: {
        replicaCount: 1,
        image: {
          repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/bitbucket",
          tag: "8.9.0"
        },
        database: {
          url: "jdbc:postgresql://postgresql:5432/bitbucket",
          driver: "org.postgresql.Driver",
          credentials: {
            secretName: "bitbucket.postgresql.credentials.postgresql.acid.zalan.do"
          }
        },
        volumes: {
          localHome: {
            persistentVolumeClaim: {
              create: true,
              storageClassName: "longhorn",
              resources: {
                requests: { storage: "1Gi" }
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
            baseUrl: "http://opensearch-master.skywalking:9200",
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
        podLabels: { customer: "demo", environment: "dev", project: "Developer", group: "bitbucket", datacenter: "dc01", domain: "local" }
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
  // Create Kubernetes Secret.
  const secret = new k8s.core.v1.Secret(deploy_spec[i].secret.metadata.name, {
    metadata: deploy_spec[i].secret.metadata,
    type: deploy_spec[i].secret.type,
    data: deploy_spec[i].secret.data,
    stringData: deploy_spec[i].secret.stringData
  }, { dependsOn: [namespace] });
  // Create Release Resource.
  const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
    namespace: deploy_spec[i].helm.namespace,
    name: deploy_spec[i].helm.name,
    chart: deploy_spec[i].helm.chart,
    version: deploy_spec[i].helm.version,
    values: deploy_spec[i].helm.values,
    skipAwait: true,
  }, { dependsOn: [namespace] });
}