import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

const podlabels = {
    customer: "demo",
    environment: "prd",
    project: "Operator",
    group: "Redis",
    datacenter: "cn-north",
    domain: "local"
}

let config = new pulumi.Config();

const resources = [
    {
        namespace: {
            metadata: {
                name: "redis-operator",
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
                namespace: "redis-operator",
                name: "redis-operator",
                chart: "redis-operator",
                repositoryOpts: {
                    repo: "https://ot-container-kit.github.io/helm-charts"
                },
                version: "0.15.10",
                values: {
                    redisOperator: {
                        imagePullPolicy: "IfNotPresent",
                        podLabels: podlabels,
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    replicas: 1
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });