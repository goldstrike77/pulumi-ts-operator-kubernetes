import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const podlabels = {
    customer: "demo",
    environment: "dev",
    project: "Certificate",
    group: "Cert-Manager",
    datacenter: "dc01",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "cert-manager",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        release: [
            {
                namespace: "cert-manager",
                name: "cert-manager",
                chart: "cert-manager",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "0.13.3",
                values: {
                    logLevel: 2,
                    installCRDs: true,
                    controller: {
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        podLabels: podlabels,
                    },
                    webhook: {
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        podLabels: podlabels
                    },
                    cainjector: {
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        podLabels: podlabels,
                    },
                    metrics: {
                        enabled: true,
                        serviceMonitor: {
                            enabled: true,
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

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });