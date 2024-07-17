import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

const resources = [
  {
    namespace: {
      metadata: {
        name: "crunchydata",
        annotations: {},
        labels: {
          "pod-security.kubernetes.io/enforce": "privileged",
          "pod-security.kubernetes.io/audit": "privileged",
          "pod-security.kubernetes.io/warn": "privileged"
        }
      },
      spec: {}
    },
    release: [
      {
        namespace: "crunchydata",
        name: "postgres-operator",
        chart: "../../_chart/pgo-operator-5.6.0.tgz",
        version: "5.6.0",
        values: {
          "controllerImages": {
            "cluster": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-postgres-operator:ubi8-5.6.0-0"
          },
          "relatedImages": {
            "postgres_16": {
              "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-postgres:ubi8-16.3-1"
            },
            "postgres_16_gis_3.4": {
              "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-postgres-gis:ubi8-16.3-3.4-1"
            },
            "postgres_16_gis_3.3": {
              "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-postgres-gis:ubi8-16.3-3.3-1"
            },
            "postgres_15": {
              "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-postgres:ubi8-15.7-1"
            },
            "postgres_15_gis_3.3": {
              "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-postgres-gis:ubi8-15.7-3.3-1"
            },
            "pgadmin": {
              "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-pgadmin4:ubi8-4.30-26"
            },
            "pgbackrest": {
              "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-pgbackrest:ubi8-2.51-1"
            },
            "pgbouncer": {
              "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-pgbouncer:ubi8-1.22-1"
            },
            "pgexporter": {
              "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-postgres-exporter:ubi8-0.15.0-7"
            },
            "pgupgrade": {
              "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-upgrade:ubi8-5.6.0-0"
            },
            "standalone_pgadmin": {
              "image": "registry.cn-shanghai.aliyuncs.com/goldenimage/crunchy-pgadmin4:ubi8-8.6-1"
            }
          },
          singleNamespace: false,
          debug: false,
          disable_check_for_upgrades: true,
          resources: {
            controller: {
              limits: { cpu: "100m", memory: "128Mi" },
              requests: { cpu: "100m", memory: "128Mi" }
            }
          },
          customPodLabels: {
            app: "postgres-operator",
            customer: "it",
            datacenter: "cn-north",
            domain: "local",
            environment: "prd",
            group: "Postgres",
            project: "Operator"
          }
        }
      }
    ]
  }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });