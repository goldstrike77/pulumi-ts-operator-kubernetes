import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const labels = {
    customer: "sales",
    environment: "prd",
    cluster: "ocp-sales-prd-shared-2c-01",
    datacenter: "cn-north",
    domain: "local"
}

const resources = [
    {
        secret: [
            {
                metadata: {
                    name: "vector-splunk-secret",
                    namespace: "openshift-logging",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "hecToken": Buffer.from(config.require("hecToken")).toString('base64')
                },
                stringData: {}
            }
        ],
        customresource: [
            {
                apiVersion: "logging.openshift.io/v1",
                kind: "ClusterLogging",
                metadata: {
                    name: "instance",
                    namespace: "openshift-logging"
                },
                spec: {
                    collection: {
                        resources: {
                            limits: { cpu: "300m", memory: "512Mi" },
                            requests: { cpu: "300m", memory: "512Mi" }
                        },
                        type: "vector"
                    }
                }
            },
            {
                apiVersion: "logging.openshift.io/v1",
                kind: "ClusterLogForwarder",
                metadata: {
                    name: "instance",
                    namespace: "openshift-logging"
                },
                spec: {
                    filters: [
                        {
                            name: "filter-severity",
                            type: "drop",
                            drop: [
                                {
                                    "test": [
                                        {
                                            "field": ".level",
                                            "matches": "info|debug"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: "filter-audit",
                            type: "kubeAPIAudit",
                            kubeAPIAudit: {
                                omitStages: [
                                    "RequestReceived"
                                ],
                                rules: [
                                    {
                                        // Resource "pods" doesn't match requests to any subresource of pods,
                                        // which is consistent with the RBAC policy.
                                        level: "RequestResponse",
                                        resources: [
                                            {
                                                group: "",
                                                resources: ["pods"],
                                                verbs: ["create", "patch", "update", "delete"]
                                            }
                                        ]
                                    },
                                    {
                                        // Log "pods/log", "pods/status" at Metadata level.
                                        level: "Metadata",
                                        resources: [
                                            {
                                                group: "",
                                                resources: ["pods/log", "pods/status"]
                                            }
                                        ]
                                    },
                                    {
                                        // Don't log requests to a configmap called "controller-leader".
                                        level: "None",
                                        resources: [
                                            {
                                                group: "",
                                                resources: ["configmaps"],
                                                resourceNames: ["controller-leader"]
                                            }
                                        ]
                                    },
                                    {
                                        // Don't log watch requests by the "system:kube-proxy" on endpoints or services.
                                        level: "None",
                                        users: ["system:kube-proxy"],
                                        verbs: ["watch"],
                                        resources: [
                                            {
                                                group: "",
                                                resources: ["endpoints", "services"]
                                            }
                                        ]
                                    },
                                    {
                                        // Don't log requests to the following.
                                        level: "None",
                                        userGroups: ["system:authenticated"],
                                        nonResourceURLs: ["/api*", "/healthz*", "/logs", "/metrics", "/swagger*", "/version"]
                                    },
                                    {
                                        // Log the request body of configmap changes in kube-system.
                                        level: "Request",
                                        resources: [
                                            {
                                                group: "",
                                                resources: ["configmaps"]
                                            }
                                        ],
                                        namespaces: ["kube-system"]
                                    },
                                    {
                                        // Log configmap and secret changes in all other namespaces at the Metadata level.
                                        level: "Metadata",
                                        resources: [
                                            {
                                                group: "",
                                                resources: ["secrets", "configmaps"]
                                            }
                                        ]
                                    },
                                    {
                                        // Log all other resources in core and extensions at the Request level.
                                        level: "Request",
                                        resources: [
                                            {
                                                group: ""
                                            },
                                            {
                                                group: "extensions"
                                            }
                                        ]
                                    },
                                    {
                                        // Limit level to Metadata so token is not included in the spec/status.
                                        level: "Metadata",
                                        omitStages: ["RequestReceived"],
                                        resources: [
                                            {
                                                group: "authentication.k8s.io",
                                                resources: ["tokenreviews"]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ],
                    outputs: [
                        {
                            name: "splunk-application",
                            secret: { "name": "vector-splunk-secret" },
                            splunk: { "indexName": "openshift-application" },
                            tls: { "insecureSkipVerify": true },
                            type: "splunk",
                            url: "https://192.168.0.240:8088"
                        },
                        {
                            name: "splunk-audit",
                            secret: { "name": "vector-splunk-secret" },
                            splunk: { "indexName": "openshift-audit" },
                            tls: { "insecureSkipVerify": true },
                            type: "splunk",
                            url: "https://192.168.0.240:8088"
                        },
                        {
                            name: "splunk-infrastructure",
                            secret: { "name": "vector-splunk-secret" },
                            splunk: { "indexName": "openshift-infrastructure" },
                            tls: { "insecureSkipVerify": true },
                            type: "splunk",
                            url: "https://192.168.0.240:8088"
                        }
                    ],
                    pipelines: [
                        {
                            name: "splunk-application",
                            detectMultilineErrors: true,
                            parse: "json",
                            labels: labels,
                            inputRefs: ["application"],
                            outputRefs: ["splunk-application"],
                            filterRefs: ["filter-severity"]
                        },
                        {
                            name: "splunk-audit",
                            detectMultilineErrors: true,
                            parse: "json",
                            labels: labels,
                            inputRefs: ["audit"],
                            outputRefs: ["splunk-audit"],
                            filterRefs: ["filter-audit"]
                        },
                        {
                            name: "splunk-infrastructure",
                            detectMultilineErrors: true,
                            parse: "json",
                            labels: labels,
                            inputRefs: ["infrastructure"],
                            outputRefs: ["splunk-infrastructure"]
                        }
                    ]
                }
            }
        ]
    }
]

const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [secret] });