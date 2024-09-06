import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "gitlab",
                    annotations: {},
                    labels: {}
                },
                spec: {}
            }
        ],
        release: [
            /**
                        {
                            namespace: "gitlab",
                            name: "gitlab",
                            chart: "gitlab",
                            repositoryOpts: {
                                repo: "https://charts.gitlab.io"
                            },
                            version: "8.3.1",
                            values: {
                                global: {
                                    edition: "ce",
                                    hosts: {
                                        domain: "home.local",
                                        hostSuffix: "gitlab"
                                    },
                                    ingress: {
                                        configureCertmanager: false,
                                        class: "traefik"
                                    },
                                    //  "initialRootPassword": {
                                    //      "secret": "gitlab-initial-root-password",
                                    //      "key": "password"
                                    //  },
                                    "time_zone": "PRC"
                                },
                                upgradeCheck: { enabled: false },
                                "nginx-ingress": { enabled: false },
                                prometheus: { install: false }
                            }
                        },
                         */
            {
                namespace: "gitlab",
                name: "redis",
                chart: "redis",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "20.0.5",
                values: {
                    global: {
                        imageRegistry: "swr.cn-east-3.myhuaweicloud.com"
                    },
                    image: {
                        repository: "docker-io/redis",
                        tag: "6.2.14-debian-12-r26"
                    },
                    architecture: "standalone",
                    auth: {
                        enabled: false
                    },
                    commonConfiguration: `appendonly no
save ""`,
                    master: {
                        resourcesPreset: "none",
                        kind: "Deployment",
                        persistence: {
                            enabled: false
                        }
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });