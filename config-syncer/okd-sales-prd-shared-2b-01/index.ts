import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

const resources = [
    {
        namespace: {
            metadata: {
                name: "kubeops",
                annotations: {
                    "openshift.io/sa.scc.mcs": 's0:c27,c4',
                    "openshift.io/sa.scc.supplemental-groups": "1000710000/10000",
                    "openshift.io/sa.scc.uid-range": "1000710000/10000"
                },
                labels: {}
            },
            spec: {}
        },
        release: [
            {
                namespace: "kubeops",
                name: "config-syncer",
                chart: "config-syncer",
                repositoryOpts: {
                    repo: "https://charts.appscode.com/stable"
                },
                version: "v0.14.1",
                values: {
                    replicaCount: 1,
                    registryFQDN: "ccr.ccs.tencentyun.com",
                    image: {
                        registry: "ghcr-io",
                        repository: "config-syncer",
                        tag: "v0.14.1",
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        securityContext: {
                            runAsUser: 1000710000
                        }
                    },
                    logLevel: 3,
                    podSecurityContext: {
                        fsGroup: 1000710000
                    },
                    config: {
                        clusterName: "okd-sales-prd-shared-2b-01"
                    },

                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });