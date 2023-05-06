import * as k8s from "@pulumi/kubernetes";
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

const deploy_spec = [
  {
    namespace: {
      metadata: {
        name: "velero",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    helm: {
      namespace: "velero",
      name: "velero",
      chart: "velero",
      repository: "https://vmware-tanzu.github.io/helm-charts",
      version: "4.0.1",
      values: {
        podLabels: { customer: "demo", environment: "dev", project: "Backup", group: "Velero", datacenter: "dc01", domain: "local" },
        resources: {
          requests: { cpu: "500m", memory: "512Mi" },
          limits: { cpu: "500m", memory: "512Mi" }
        },
        initContainers: [
          {
            name: "velero-plugin-for-csi",
            image: "velero/velero-plugin-for-csi:v0.5.0",
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
            image: "velero/velero-plugin-for-aws:v1.7.0",
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
              bucket: "backup",
              prefix: "norther",
              accessMode: "ReadWrite",
              config: {
                region: "minio-default",
                s3ForcePathStyle: true,
                s3Url: "http://minio:9000",
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
              cluster: "norther"
            },
            schedule: pulumi.interpolate`${minutes.result} ${hours.result} * * * `,
            useOwnerReferencesInBackup: false,
            template: {
              ttl: "48h",
              storageLocation: "default"
            }
          }
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