import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

// Generate random minutes from 10 to 59.
const minutes = new random.RandomInteger("minutes", {
    seed: `${pulumi.getStack()}-${pulumi.getProject()}`,
    max: 59,
    min: 10,
});

// Generate random hours from UTC 17 to 21.
const hours = new random.RandomInteger("hours", {
    seed: `${pulumi.getStack()}-${pulumi.getProject()}`,
    max: 21,
    min: 17,
});

const resources = [
    {
        secret: [
            {
                metadata: {
                    name: "cloud-credentials",
                    namespace: "openshift-adp",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "cloud": config.require("credentials-velero")
                },
                stringData: {}
            }
        ],
        customresource: [
            {
                apiVersion: "oadp.openshift.io/v1alpha1",
                kind: "DataProtectionApplication",
                metadata: {
                    name: "dpa-velero",
                    namespace: "openshift-adp"
                },
                spec: {
                    backupLocations: [
                        {
                            name: "bsl-s3-1",
                            velero: {
                                config: {
                                    profile: "default",
                                    region: "minio",
                                    s3ForcePathStyle: "true",
                                    s3Url: "http://obs.home.local:9000",
                                    insecureSkipTLSVerify: "true"
                                },
                                credential: {
                                    key: "cloud",
                                    name: "cloud-credentials"
                                },
                                default: true,
                                objectStorage: {
                                    bucket: "velero",
                                    prefix: "ocp-sales-prd-shared-2c-01"
                                },
                                provider: "aws"
                            }
                        }
                    ],
                    configuration: {
                        nodeAgent: {
                            enable: true,
                            uploaderType: "kopia",
                            podConfig: {
                                resourceAllocations: {
                                    requests: { cpu: "1000m", memory: "1024Mi" },
                                    limits: { cpu: "2000m", memory: "2048Mi" }

                                }
                            }
                        },
                        velero: {
                            defaultPlugins: [
                                "csi",
                                "openshift",
                                "aws",
                                "kubevirt"
                            ],
                            podConfig: {
                                resourceAllocations: {
                                    requests: { cpu: "1000m", memory: "1024Mi" },
                                    limits: { cpu: "2000m", memory: "2048Mi" }
                                }
                            }
                        }
                    }
                }
            },
            {
                apiVersion: "velero.io/v1",
                kind: "VolumeSnapshotLocation",
                metadata: {
                    name: "vsl-s3-1",
                    namespace: "openshift-adp"
                },
                spec: {
                    config: {
                        profile: "default",
                        region: "minio"
                    },
                    credential: {
                        key: "cloud",
                        name: "cloud-credentials"
                    },
                    provider: "aws"
                }
            },
            {
                apiVersion: "velero.io/v1",
                kind: "Schedule",
                metadata: {
                    name: "s-velero",
                    namespace: "openshift-adp"
                },
                spec: {
                    schedule: pulumi.interpolate`${minutes.result} ${hours.result} * * * `,
                    template: {
                        defaultVolumesToFsBackup: false,
                        hooks: {},
                        includedNamespaces: [
                            "apisix",
                            "monitoring"
                        ],
                        snapshotMoveData: true,
                        storageLocation: "bsl-s3-1",
                        volumeSnapshotLocations: ["vsl-s3-1"],
                        ttl: "72h0m0s"
                    }
                }
            }
        ]
    }
]

const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [secret] });