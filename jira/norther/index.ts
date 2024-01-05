import * as k8s_module from '../../../module/pulumi-ts-module-kubernetes';

const podlabels = {
  customer: "demo",
  environment: "dev",
  project: "Developer",
  group: "Jira",
  datacenter: "dc01",
  domain: "local"
}

const resources = [
  {
    namespace: {
      metadata: {
        name: "jira",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    customresource: [
      {
        kind: "postgresql",
        apiVersion: "acid.zalan.do/v1",
        metadata: {
          name: "postgresql",
          namespace: "jira",
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
            size: "15Gi",
            storageClass: "vsphere-san-sc"
          },
          users: {
            jira: []
          },
          databases: {
            jira: "jira"
          },
          allowedSourceRanges: ["10.244.0.0/16"],
          resources: {
            limits: { cpu: "500m", memory: "512Mi" },
            requests: { cpu: "500m", memory: "512Mi" }
          }
        }
      }
    ],
    release: [
      {
        namespace: "jira",
        name: "jira",
        chart: "../../_chart/jira-1.17.2.tgz",
        repository: "",
        version: "1.17.2",
        values: {
          replicaCount: 1,
          image: {
            repository: "swr.cn-east-3.myhuaweicloud.com/atlassian/jira-software",
            tag: "9.12.1"
          },
          database: {
            type: "postgres72",
            url: "jdbc:postgresql://postgresql:5432/jira",
            driver: "org.postgresql.Driver",
            credentials: {
              secretName: "jira.postgresql.credentials.postgresql.acid.zalan.do"
            }
          },
          volumes: {
            localHome: {
              persistentVolumeClaim: {
                create: true,
                storageClassName: "vsphere-san-sc",
                resources: {
                  requests: {
                    storage: "7Gi"
                  }
                }
              }
            },
            sharedHome: {
              persistentVolumeClaim: {
                create: true,
                storageClassName: "nfs-sc",
                resources: {
                  requests: {
                    storage: "31Gi"
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
            path: "/jira"
          },
          jira: {
            service: {
              contextPath: "/jira"
            },
            clustering: { enabled: true },
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
          monitoring: {
            exposeJmxMetrics: true,
            jmxExporterInitContainer: {
              resources: {
                requests: { cpu: "100m", memory: "256Mi" },
                limits: { cpu: "100m", memory: "256Mi" }
              }
            },
            jmxExporterImageRepo: "swr.cn-east-3.myhuaweicloud.com/exporter/jmx-exporter",
            jmxExporterImageTag: "0.20.0",
            serviceMonitor: {
              create: true,
              scrapeIntervalSeconds: 60
            }
          },
          podLabels: podlabels
        }
      }
    ]
  }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [release] });