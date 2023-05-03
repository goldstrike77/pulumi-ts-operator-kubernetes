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
    helm: [
      {
        namespace: "bitbucket",
        name: "postgres",
        chart: "../../_chart/pgo-postgres-5.3.1.tgz",
        repository: "",
        version: "5.3.1",
        values: {
          postgresVersion: "14",
          monitoring: true,
          instanceSize: "10Gi",
          instanceStorageClassName: "longhorn",
          instanceMemory: "512Mi",
          instanceCPU: "500m",
          backupsSize: "10Gi",
          backupsStorageClassName: "longhorn",
          s3: {
            bucket: "backup",
            endpoint: "http://minio:9000",
            region: "us-east-1",
            key: config.require("AWS_ACCESS_KEY_ID"),
            keySecret: config.require("AWS_SECRET_ACCESS_KEY")
          },
          service: {
            type: "ClusterIP"
          }
        }
      },
      {
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
            url: "jdbc:postgresql://postgres-primary:5432/postgres",
            driver: "org.postgresql.Driver",
            credentials: {
              secretName: "postgres-pguser-postgres",
              usernameSecretKey: "user",
              passwordSecretKey: "password"
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
    ],
    servicemonitors: {
      apiVersion: "monitoring.coreos.com/v1",
      kind: "PodMonitor",
      metadata: {
        name: "postgres-exporter",
        labels: {
          release: "prometheus-operator"
        },
        namespace: "monitoring"
      },
      spec: {
        namespaceSelector: {
          matchNames: ["bitbucket"]
        },
        selector: {
          matchLabels: {
            "postgres-operator.crunchydata.com/crunchy-postgres-exporter": "true"
          }
        },
        podMetricsEndpoints: [
          {
            interval: "60s",
            path: "/metrics",
            port: "exporter",
            relabelings: [
              {
                source_labels: ["__meta_kubernetes_pod_label_postgres_operator_crunchydata_com_crunchy_postgres_exporter", "__meta_kubernetes_pod_label_crunchy_postgres_exporter"],
                action: "keep",
                regex: "true",
                separator: ""
              },
              {
                source_labels: ["__meta_kubernetes_pod_container_port_number"],
                action: "drop",
                regex: "5432"
              },
              {
                source_labels: ["__meta_kubernetes_pod_container_port_number"],
                action: "drop",
                regex: "10000"
              },
              {
                source_labels: ["__meta_kubernetes_pod_container_port_number"],
                action: "drop",
                regex: "8009"
              },
              {
                source_labels: ["__meta_kubernetes_pod_container_port_number"],
                action: "drop",
                regex: "2022"
              },
              {
                source_labels: ["__meta_kubernetes_pod_container_port_number"],
                action: "drop",
                regex: "^$"
              },
              {
                source_labels: ["__meta_kubernetes_namespace"],
                action: "replace",
                target_label: "kubernetes_namespace"
              },
              {
                source_labels: ["__meta_kubernetes_pod_name"],
                target_label: "pod"
              },
              {
                source_labels: ["__meta_kubernetes_pod_label_postgres_operator_crunchydata_com_cluster", "__meta_kubernetes_pod_label_pg_cluster"],
                target_label: "cluster",
                separator: "",
                replacement: "$1"
              },
              {
                source_labels: ["__meta_kubernetes_namespace", "cluster"],
                target_label: "pg_cluster",
                separator: ":",
                replacement: "$1$2"
              },
              {
                source_labels: ["__meta_kubernetes_pod_ip"],
                target_label: "ip",
                replacement: "$1"
              },
              {
                source_labels: ["__meta_kubernetes_pod_label_postgres_operator_crunchydata_com_instance", "__meta_kubernetes_pod_label_deployment_name"],
                target_label: "deployment",
                replacement: "$1",
                separator: ""
              },
              {
                source_labels: ["__meta_kubernetes_pod_label_postgres_operator_crunchydata_com_role", "__meta_kubernetes_pod_label_role"],
                target_label: "role",
                replacement: "$1",
                separator: ""
              },
              {
                source_labels: ["dbname"],
                target_label: "dbname",
                replacement: "$1"
              },
              {
                source_labels: ["relname"],
                target_label: "elname",
                replacement: "$1"
              },
              {
                source_labels: ["schemaname"],
                target_label: "schemaname",
                replacement: "$1"
              }
            ]
          }
        ]
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
  // Create service monitors.
  const monitor = new k8s.apiextensions.CustomResource(deploy_spec[i].servicemonitors.metadata.name, {
    name: deploy_spec[i].servicemonitors.metadata.name,
    metadata: deploy_spec[i].servicemonitors.metadata,
    apiVersion: deploy_spec[i].servicemonitors.apiVersion,
    kind: deploy_spec[i].servicemonitors.kind,
    spec: deploy_spec[i].servicemonitors.spec,
  }, { dependsOn: [namespace] });
  // Create Release Resource.
  for (var helm_index in deploy_spec[i].helm) {
    const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
      namespace: deploy_spec[i].helm[helm_index].namespace,
      name: deploy_spec[i].helm[helm_index].name,
      chart: deploy_spec[i].helm[helm_index].chart,
      version: deploy_spec[i].helm[helm_index].version,
      values: deploy_spec[i].helm[helm_index].values,
      skipAwait: true,
    }, { dependsOn: [namespace] });
  }
}