import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

// Generate random minutes from 10 to 59.
const minutes = new random.RandomInteger("minutes", {
  seed: `${pulumi.getStack()}-${pulumi.getProject()}`,
  max: 59,
  min: 10,
});

// Generate random hours from UTC 17 to 21.
const hours = new random.RandomInteger("hours", {
  seed: `${pulumi.getStack()}-${pulumi.getProject()}`,
  max: 21,
  min: 17,
});

let config = new pulumi.Config();

const podlabels = {
  customer: "it",
  environment: "prd",
  project: "Backup",
  group: "Velero",
  datacenter: "cn-north",
  domain: "local"
}

const resources = [
  {
    namespace: [
      {
        metadata: {
          name: "velero",
          annotations: {},
          labels: {
            "pod-security.kubernetes.io/enforce": "privileged",
            "pod-security.kubernetes.io/audit": "privileged",
            "pod-security.kubernetes.io/warn": "privileged"
          }
        },
        spec: {}
      }
    ],
    release: [
      {
        namespace: "default",
        name: "velero",
        chart: "velero",
        repositoryOpts: {
          repo: "https://vmware-tanzu.github.io/helm-charts"
        },
        version: "7.2.1",
        values: {
          image: {
            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/velero"
          },
          podLabels: podlabels,
          resources: {
            requests: { cpu: "500m", memory: "512Mi" },
            limits: { cpu: "500m", memory: "512Mi" }
          },
          initContainers: [
            {
              name: "velero-plugin-for-csi",
              image: "swr.cn-east-3.myhuaweicloud.com/docker-io/velero-plugin-for-csi:v0.7.1",
              imagePullPolicy: "IfNotPresent",
              volumeMounts: [
                {
                  mountPath: "/target",
                  name: "plugins"
                }
              ]
            },
            {
              name: "velero-plugin-for-aws",
              image: "swr.cn-east-3.myhuaweicloud.com/docker-io/velero-plugin-for-aws:v1.10.1",
              imagePullPolicy: "IfNotPresent",
              volumeMounts: [
                {
                  mountPath: "/target",
                  name: "plugins"
                }
              ]
            }
          ],
          metrics: {
            enabled: true,
            scrapeInterval: "60s",
            scrapeTimeout: "30s",
            serviceMonitor: { enabled: true },
            nodeAgentPodMonitor: { enabled: true },
            prometheusRule: {
              enabled: true,
              spec: [
                {
                  alert: "VeleroBackupPartialFailures",
                  annotations: {
                    message: "Velero backup {{ $labels.schedule }} has {{ $value | humanizePercentage }} partialy failed backups."
                  },
                  expr: 'velero_backup_partial_failure_total{schedule!=""} / velero_backup_attempt_total{schedule!=""} > 0.25',
                  for: "15m",
                  labels: {
                    severity: "p3"
                  }
                },
                {
                  alert: "VeleroBackupFailures",
                  annotations: {
                    message: "Velero backup {{ $labels.schedule }} has {{ $value | humanizePercentage }} failed backups."
                  },
                  expr: 'velero_backup_failure_total{schedule!=""} / velero_backup_attempt_total{schedule!=""} > 0.25',
                  for: "15m",
                  labels: {
                    severity: "p3"
                  }
                }
              ]
            }
          },
          kubectl: {
            image: {
              repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/kubectl"
            },
            resources: {
              requests: { cpu: "200m", memory: "128Mi" },
              limits: { cpu: "200m", memory: "128Mi" }
            },
          },
          configuration: {
            backupStorageLocation: [
              {
                name: "default",
                provider: "aws",
                bucket: "velero",
                prefix: "rke-it-prd-infra-shared-01",
                accessMode: "ReadWrite",
                config: {
                  region: "minio-default",
                  s3ForcePathStyle: true,
                  s3Url: "https://obs.home.local",
                  insecureSkipTLSVerify: true
                }
              }
            ],
            volumeSnapshotLocation: [
              {
                name: "default",
                provider: "aws",
                config: {
                  region: "minio-default"
                }
              }
            ],
            logLevel: "info",
            defaultVolumesToFsBackup: true
          },
          credentials: {
            useSecret: true,
            secretContents: {
              cloud: `
[default]
aws_access_key_id = ${config.require("AWS_ACCESS_KEY_ID")}
aws_secret_access_key = ${config.require("AWS_SECRET_ACCESS_KEY")}
`
            }
          },
          backupsEnabled: true,
          snapshotsEnabled: true,
          deployNodeAgent: false,
          schedules: {
            backup: {
              disabled: false,
              labels: {
                cluster: "rke-it-prd-infra-shared-01"
              },
              schedule: pulumi.interpolate`${minutes.result} ${hours.result} * * * `,
              useOwnerReferencesInBackup: false,
              template: {
                ttl: "48h",
                storageLocation: "default",
                includedNamespaces: ["apisix", "monitoring"]
              }
            }
          }
        }
      }
    ]
  }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });