import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

const labels = {
  customer: "it",
  environment: "prd",
  project: "DNS",
  group: "coredns",
  datacenter: "cn-north",
  domain: "local"
}

const resources = [
  {
    release: [
      {
        namespace: "kube-system",
        name: "coredns",
        chart: "coredns",
        repositoryOpts: {
          repo: "https://coredns.github.io/helm"
        },
        version: "1.32.0",
        values: {
          image: {
            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/coredns"
          },
          replicaCount: 1,
          resources: {
            limits: { cpu: "100m", memory: "128Mi" },
            requests: { cpu: "100m", memory: "128Mi" }
          },
          prometheus: {
            service: {
              enabled: false
            },
            monitor: {
              enabled: false,
              additionalLabels: {}
            }
          },
          service: {
            clusterIP: "10.43.0.10",
            name: "kube-dns"
          },
          serviceAccount: { create: true },
          zoneFiles: [],
          customLabels: labels,
          hpa: {
            enabled: false,
            minReplicas: 1,
            maxReplicas: 2,
            metrics: []
          },
          autoscaler: {
            enabled: false,
            coresPerReplica: 256,
            nodesPerReplica: 16,
            min: 0,
            max: 0,
            includeUnschedulableNodes: false,
            preventSinglePointFailure: true,
            image: {
              repository: "swr.cn-east-3.myhuaweicloud.com/gcr-io/cluster-proportional-autoscaler",
              tag: "1.8.5"
            },
            resources: {
              limits: { cpu: "50m", memory: "32Mi" },
              requests: { cpu: "50m", memory: "32Mi" }
            }
          }
        }
      }
    ],
    networkpolicy: [
      {
        metadata: {
          labe: {},
          annotations: {},
          name: "network-coredns-policy",
          namespace: "kube-system"
        },
        spec: {
          ingress: [
            {
              ports: [
                { port: 53, protocol: "TCP" },
                { port: 53, protocol: "UDP" },
                { port: 9153, protocol: "TCP" }
              ]
            }
          ],
          podSelector: {
            matchLabels: {
              "k8s-app": "coredns"
            }
          },
          policyTypes: [
            "Ingress"
          ]
        }
      }
    ]
  }
]

const release = new k8s_module.helm.v3.Release('Release', { resources: resources });
const networkpolicy = new k8s_module.networking.v1.NetworkPolicy('NetworkPolicy', { resources: resources });