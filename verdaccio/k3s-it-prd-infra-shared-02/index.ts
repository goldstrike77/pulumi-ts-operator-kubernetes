import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "verdaccio",
                    annotations: {},
                    labels: {}
                },
                spec: {}
            }
        ],
        release: [
            {
                namespace: "verdaccio",
                name: "verdaccio",
                chart: "verdaccio",
                repositoryOpts: {
                    repo: "https://charts.verdaccio.org"
                },
                version: "4.20.0",
                values: {
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/verdaccio"
                    },
                    ingress: {
                        enabled: true,
                        className: "traefik",
                        hosts: ["npm.home.local"]
                    },
                    configMap: `storage: /verdaccio/storage/data
web:
  enable: true
  title: Verdaccio
uplinks:
  npmjs:
    url: https://registry.npmmirror.com/
    agent_options:
      keepAlive: true
      maxSockets: 40
      maxFreeSockets: 10
packages:
  '@*/*':
    access: $all
    publish: $all
    proxy: npmjs
  '**':
    access: $all
    publish: $all
    proxy: npmjs
middlewares:
  audit:
    enabled: true
log: {type: stdout, format: pretty, level: error}`,
                    persistence: {
                        enabled: true,
                        storageClass: "local-path",
                        size: "13Gi"
                    },
                    cachingNginx: {
                        enabled: true,
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/nginx"
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });