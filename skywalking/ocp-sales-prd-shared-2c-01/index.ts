import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

const resources = [
  {
    namespace: {
      metadata: {
        name: "skywalking",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    release: [
      {
        namespace: "skywalking",
        name: "swck-operator",
        chart: "../../_chart/swck-operator-0.9.0.tgz",
        version: "0.9.0",
        values: {
          fullnameOverride: "skywalking",
          replicas: 1,
          image: {
            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/skywalking-swck",
            tag: "v0.9.0"
          },
          resources: {
            limits: { cpu: "200m", memory: "256Mi" },
            requests: { cpu: "200m", memory: "256Mi" }
          }
        }
      }
    ],
    customresource: [
      {
        apiVersion: "monitoring.coreos.com/v1",
        kind: "ServiceMonitor",
        metadata: {
          name: "swck-operator",
          namespace: "skywalking"
        },
        spec: {
          endpoints: [
            {
              interval: "60s",
              scheme: "https",
              tlsConfig: {
                caFile: "/etc/prometheus/configmaps/serving-certs-ca-bundle/service-ca.crt",
                certFile: "/etc/prometheus/secrets/metrics-client-certs/tls.crt",
                keyFile: "/etc/prometheus/secrets/metrics-client-certs/tls.key",
                serverName: "skywalking-operator.skywalking.svc"
              },
              port: "https",
              relabelings: [
                { action: "replace", replacement: "sales", sourceLabels: ["__address__"], targetLabel: "customer" },
                { action: "replace", replacement: "prd", sourceLabels: ["__address__"], targetLabel: "environment" },
                { action: "replace", replacement: "APM", sourceLabels: ["__address__"], targetLabel: "project" },
                { action: "replace", replacement: "Skywalking", sourceLabels: ["__address__"], targetLabel: "group" },
                { action: "replace", replacement: "cn-north", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
              ]
            }
          ],
          jobLabel: "swck-operator",
          namespaceSelector: {
            matchNames: ["skywalking"]
          },
          selector: {
            matchLabels: {
              "control-plane": "skywalking-controller-manager"
            }
          }
        }
      }
    ]
  }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [release] });