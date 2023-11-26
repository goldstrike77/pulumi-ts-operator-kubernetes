import * as pulumi from "@pulumi/pulumi";
import { Namespace } from '../../packages/kubernetes/core/v1/Namespace';
import { Release } from '../../packages/kubernetes/helm/v3/Release';

let config = new pulumi.Config();

const podlabels = {
    customer: "demo",
    environment: "dev",
    project: "ServiceDiscovery",
    group: "consul",
    datacenter: "dc01",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "consul",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        release: [
            {
                namespace: "consul",
                name: "consul",
                chart: "consul",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "10.14.4",
                values: {
                    datacenterName: "dc1",
                    domain: "consul",
                    gossipKey: config.require("gossipKey"),
                    localConfig: `
{
    "acl": {
        "enabled": true,
        "default_policy": "deny",
        "enable_token_persistence": true,
        "tokens": {
          "initial_management": "${config.require("tokensMaster")}",
          "agent": "${config.require("tokensMaster")}"
        }
    }
}`,
                    extraEnvVars: [
                        { name: "CONSUL_HTTP_TOKEN", value: config.require("tokensMaster") }
                    ],
                    podLabels: podlabels,
                    replicaCount: 3,
                    resources: {
                        limits: { cpu: "200m", memory: "128Mi" },
                        requests: { cpu: "200m", memory: "128Mi" }
                    },
                    ingress: {
                        enabled: false,
                        hostname: "consul.example.com",
                        ingressClassName: "nginx"
                    },
                    persistence: {
                        enabled: true,
                        storageClass: "vsphere-san-sc",
                        size: "7Gi"
                    },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    },
                    metrics: {
                        enabled: false,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        },
                        serviceMonitor: {
                            enabled: false,
                            interval: "60s",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        }
                    }
                }
            }
        ]
    }
]

const namespace = new Namespace('Namespace', { resources: resources })
const release = new Release('Release', { resources: resources })