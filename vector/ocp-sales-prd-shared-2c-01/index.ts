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
                            name: "severity",
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
                            filterRefs: ["severity"]
                        },
                        {
                            name: "splunk-audit",
                            detectMultilineErrors: true,
                            parse: "json",
                            labels: labels,
                            inputRefs: ["audit"],
                            outputRefs: ["splunk-audit"]
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