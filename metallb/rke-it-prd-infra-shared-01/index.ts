import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

const podlabels = {
    customer: "it",
    environment: "prd",
    project: "Load-Balancer",
    group: "MetalLB",
    datacenter: "cn-north",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "metallb-system",
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
                namespace: "metallb-system",
                name: "metallb",
                chart: "metallb",
                repositoryOpts: {
                    repo: "https://metallb.github.io/metallb"
                },
                version: "0.14.5",
                values: {
                    prometheus: {
                        serviceAccount: "kubepromstack-prometheus",
                        namespace: "monitoring",
                        podMonitor: {
                            enabled: false,
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        },
                        serviceMonitor: {
                            enabled: false,
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        },
                        prometheusRule: {
                            enabled: false
                        }
                    },
                    controller: {
                        enabled: true,
                        image: { repository: "swr.cn-east-3.myhuaweicloud.com/quay-io/controller" },
                        logLevel: "warn",
                        securityContext: {
                            runAsNonRoot: true,
                            seccompProfile: { type: "RuntimeDefault" }
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        labels: podlabels
                    },
                    speaker: {
                        enabled: true,
                        image: { repository: "swr.cn-east-3.myhuaweicloud.com/quay-io/speaker" },
                        logLevel: "warn",
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        labels: podlabels,
                        frr: { "enabled": false }
                    }
                },
                skipAwait: false
            }
        ],
        customresource: [
            {
                apiVersion: "metallb.io/v1beta1",
                kind: "IPAddressPool",
                metadata: {
                    name: "generic-cluster-pool",
                    namespace: "metallb-system"
                },
                spec: {
                    interfaces: "ens192",
                    addresses: ["192.168.0.100-192.168.0.109"],
                    autoAssign: true
                }
            },
            {
                apiVersion: "metallb.io/v1beta1",
                kind: "L2Advertisement",
                metadata: {
                    name: "generic-cluster-pool",
                    namespace: "metallb-system"
                },
                spec: {
                    ipAddressPools: ["generic-cluster-pool"]
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [release] });