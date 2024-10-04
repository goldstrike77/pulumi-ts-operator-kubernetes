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

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "etcd-backup",
                    annotations: {},
                    labels: {}
                },
                spec: {}
            }
        ],
        secret: [
            {
                metadata: {
                    name: "aws-secret",
                    namespace: "etcd-backup",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    aws_access_key_id: Buffer.from(config.require("AWS_ACCESS_KEY_ID")).toString('base64'),
                    aws_secret_access_key: Buffer.from(config.require("AWS_SECRET_ACCESS_KEY")).toString('base64'),
                    aws_endpoint_url: Buffer.from("https://obs.home.local").toString('base64'),
                    region: Buffer.from("us-east-1").toString('base64')

                },
                stringData: {}
            }
        ],
        serviceaccount: [
            {
                metadata: {
                    name: "cronjob-etcd-backup",
                    namespace: "etcd-backup",
                    labels: {
                        "app.kubernetes.io/name": "cronjob-etcd-backup"
                    }
                }
            }
        ],
        clusterrole: [
            {
                metadata: {
                    namespace: "etcd-backup",
                    name: "cronjob-etcd-backup",
                    labels: {
                        "app.kubernetes.io/name": "cronjob-etcd-backup"
                    }
                },
                rules: [
                    {
                        verbs: ["use"],
                        apiGroups: ["security.openshift.io"],
                        resources: ["securitycontextconstraints"],
                        resourceNames: ["privileged"]
                    }
                ]
            }
        ],
        clusterrolebinding: [
            {
                metadata: {
                    namespace: "etcd-backup",
                    name: "cronjob-etcd-backup",
                    labels: {
                        "app.kubernetes.io/name": "cronjob-etcd-backup"
                    }
                },
                subjects: [
                    {
                        kind: "ServiceAccount",
                        name: "cronjob-etcd-backup",
                        namespace: "etcd-backup"
                    }
                ],
                roleref: {
                    apiGroup: "rbac.authorization.k8s.io",
                    kind: "ClusterRole",
                    name: "cronjob-etcd-backup"
                }
            }
        ],
        cronjob: [
            {
                metadata: {
                    name: "cronjob-etcd-backup",
                    namespace: "etcd-backup",
                    labels: {
                        "app.kubernetes.io/name": "cronjob-etcd-backup"
                    }
                },
                spec: {
                    schedule: pulumi.interpolate`${minutes.result} */2 * * *`,
                    concurrencyPolicy: "Forbid",
                    suspend: false,
                    jobTemplate: {
                        metadata: {
                            labels: {
                                "app.kubernetes.io/name": "cronjob-etcd-backup"
                            }
                        },
                        spec: {
                            backoffLimit: 0,
                            template: {
                                metadata: {
                                    labels: {
                                        "app.kubernetes.io/name": "cronjob-etcd-backup"
                                    }
                                },
                                spec: {
                                    nodeSelector: {
                                        "node-role.kubernetes.io/master": ""
                                    },
                                    restartPolicy: "Never",
                                    activeDeadlineSeconds: 500,
                                    serviceAccountName: "cronjob-etcd-backup",
                                    hostPID: true,
                                    hostNetwork: true,
                                    enableServiceLinks: true,
                                    schedulerName: "default-scheduler",
                                    terminationGracePeriodSeconds: 60,
                                    securityContext: {},
                                    initContainers: [
                                        {
                                            name: "cronjob-etcd-backup",
                                            image: "registry.redhat.io/openshift4/ose-cli",
                                            resources: {
                                                limits: { cpu: "200m", memory: "128Mi" },
                                                requests: { cpu: "200m", memory: "128Mi" }
                                            },
                                            terminationMessagePath: "/dev/termination-log",
                                            command: [
                                                "/bin/bash",
                                                "-c",
                                                "echo -e '\\n\\n---\\nCreate etcd backup local to master\\n' && chroot /host /usr/local/bin/cluster-backup.sh /home/core/backup/$(date \"+%F_%H%M%S_CST\") && echo -e '\\n\\n---\\nCleanup old local etcd backups\\n' && chroot /host find /home/core/backup/ -mindepth 1 -type d -mtime +15 | xargs rm -rf {} \\;"
                                            ],
                                            securityContext: {
                                                privileged: true,
                                                runAsUser: 0,
                                                capabilities: {
                                                    add: [
                                                        "SYS_CHROOT"
                                                    ]
                                                }
                                            },
                                            imagePullPolicy: "IfNotPresent",
                                            volumeMounts: [
                                                {
                                                    name: "host",
                                                    mountPath: "/host"
                                                },
                                                {
                                                    name: "cst-timezone",
                                                    mountPath: "/etc/localtime"
                                                }
                                            ],
                                            terminationMessagePolicy: "File"
                                        }
                                    ],
                                    containers: [
                                        {
                                            name: "aws-cli",
                                            image: "swr.cn-east-3.myhuaweicloud.com/docker-io/aws-cli:2.17.26",
                                            resources: {
                                                limits: { cpu: "200m", memory: "128Mi" },
                                                requests: { cpu: "200m", memory: "128Mi" }
                                            },
                                            command: [
                                                "/bin/bash",
                                                "-c",
                                                "while true; do if [[ $(find /host/home/core/backup/ -type d -cmin -1 | wc -c) -ne 0 ]]; then aws --delete --no-progress --cli-connect-timeout 30 --cli-read-timeout 30 --no-verify-ssl s3 sync /host/home/core/backup/ s3://backup/ocp-sales-prd-shared-2c-01; break; fi; done"
                                            ],
                                            env: [
                                                {
                                                    name: "AWS_ACCESS_KEY_ID",
                                                    valueFrom: {
                                                        secretKeyRef: {
                                                            name: "aws-secret",
                                                            key: "aws_access_key_id"
                                                        }
                                                    }
                                                },
                                                {
                                                    name: "AWS_SECRET_ACCESS_KEY",
                                                    valueFrom: {
                                                        secretKeyRef: {
                                                            name: "aws-secret",
                                                            key: "aws_secret_access_key"
                                                        }
                                                    }
                                                },
                                                {
                                                    name: "AWS_ENDPOINT_URL",
                                                    valueFrom: {
                                                        secretKeyRef: {
                                                            name: "aws-secret",
                                                            key: "aws_endpoint_url"
                                                        }
                                                    }
                                                },
                                                {
                                                    name: "AWS_DEFAULT_REGION",
                                                    valueFrom: {
                                                        secretKeyRef: {
                                                            name: "aws-secret",
                                                            key: "region"
                                                        }
                                                    }
                                                }
                                            ],
                                            volumeMounts: [
                                                {
                                                    name: "host",
                                                    mountPath: "/host"
                                                },
                                                {
                                                    name: "cst-timezone",
                                                    mountPath: "/etc/localtime"
                                                }
                                            ]
                                        }
                                    ],
                                    volumes: [
                                        {
                                            name: "host",
                                            hostPath: {
                                                path: "/",
                                                type: "Directory"
                                            }
                                        },
                                        {
                                            name: "cst-timezone",
                                            hostPath: {
                                                path: "/usr/share/zoneinfo/PRC",
                                                type: "File"
                                            }
                                        }
                                    ],
                                    dnsPolicy: "ClusterFirst",
                                    tolerations: [
                                        {
                                            "key": "node-role.kubernetes.io/master"
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    successfulJobsHistoryLimit: 5,
                    failedJobsHistoryLimit: 5
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const serviceaccount = new k8s_module.core.v1.ServiceAccount('ServiceAccount', { resources: resources }, { dependsOn: [namespace] });
const clusterrole = new k8s_module.rbac.v1.ClusterRole('ClusterRole', { resources: resources }, { dependsOn: [namespace] });
const clusterrolebinding = new k8s_module.rbac.v1.ClusterRoleBinding('ClusterRoleBinding', { resources: resources }, { dependsOn: [clusterrole, serviceaccount] });
const cronjob = new k8s_module.batch.v1.CronJob('CronJob', { resources: resources }, { dependsOn: [clusterrolebinding, secret] });