import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const resources = [
    {
        namespace: {
            metadata: {
                name: "optscale",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "cluster-secret",
                    namespace: "optscale",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "cluster_secret": Buffer.from("fc83d31-461d-44c5-b4d5-41a32d6c36a1").toString('base64')
                },
                stringData: {}
            }
        ],
        release: [
            {
                namespace: "optscale",
                name: "optscale",
                chart: "../../_chart/optscale-2023112401-public.tgz",
                repository: "",
                version: "2023112401-public",
                values: {
                    secrets: {
                        cluster: "fc83d31-461d-44c5-b4d5-41a32d6c36a1"
                    },
                    storageClassName: "vsphere-san-sc",
                    ingress: {
                        class: "nginx",
                        hostname: "optscale.example.com"
                    },
                    etcd: {
                        persistence: {
                            size: "7Gi"
                        }
                    },
                    rabbitmq: {
                        persistence: {
                            size: "7Gi"
                        }
                    },
                    thanos_compactor: {
                        persistence: {
                            size: "31Gi"
                        }
                    },
                    thanos_receive: {
                        persistence: {
                            size: "31Gi"
                        }
                    },
                    thanos_storegateway: {
                        persistence: {
                            size: "31Gi"
                        }
                    },
                    elk: {
                        enabled: true
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
//const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] })