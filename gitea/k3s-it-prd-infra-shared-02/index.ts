import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "gitea",
                    annotations: {},
                    labels: {}
                },
                spec: {}
            }
        ],
        release: [
            {
                namespace: "gitea",
                name: "gitea",
                chart: "gitea",
                repositoryOpts: {
                    repo: "https://dl.gitea.com/charts"
                },
                version: "10.4.1",
                values: {
                    global: {
                        imageRegistry: "swr.cn-east-3.myhuaweicloud.com"
                    },
                    image: {
                        repository: "docker-io/gitea",
                        tag: "1.22.3"
                    },
                    ingress: {
                        enabled: true,
                        className: "traefik",
                        hosts: [
                            {
                                "host": "gitea.home.local",
                                "paths": [
                                    {
                                        "path": "/",
                                        "pathType": "Prefix"
                                    }
                                ]
                            }
                        ]
                    },
                    gitea: {
                        admin: {
                            username: "root",
                            password: config.require("ADMIN-PASSWORD")
                        }
                    },
                    "redis-cluster": { enabled: false },
                    redis: {
                        enabled: true,
                        image: {
                            repository: "docker-io/redis"
                        },
                        master: {
                            resourcesPreset: "none",
                            resources: {}
                        }
                    },
                    "postgresql-ha": { enabled: false },
                    postgresql: {
                        enabled: true,
                        image: {
                            repository: "docker-io/postgresql"
                        },
                        primary: {
                            resourcesPreset: "none",
                            resources: {}
                        }
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });