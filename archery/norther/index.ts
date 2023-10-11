import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

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

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "archery",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "archery-s3-credentials",
                    namespace: "archery",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "AWS_ACCESS_KEY_ID": Buffer.from(config.require("AWS_ACCESS_KEY_ID")).toString('base64'),
                    "AWS_SECRET_ACCESS_KEY": Buffer.from(config.require("AWS_SECRET_ACCESS_KEY")).toString('base64')
                },
                stringData: {}
            }
        ],
        crds: [
            {
                apiVersion: "pxc.percona.com/v1",
                kind: "PerconaXtraDBCluster",
                metadata: {
                    name: "archery",
                    namespace: "archery",
                    finalizers: ["delete-pxc-pods-in-order"]
                },
                spec: {
                    crVersion: "1.13.0",
                    pause: false,
                    pxc: {
                        size: 3,
                        image: "percona/percona-xtradb-cluster:8.0.31-23.2",
                        imagePullPolicy: "IfNotPresent",
                        autoRecovery: true,
                        expose: { "enabled": false },
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        },
                        affinity: { "antiAffinityTopologyKey": "kubernetes.io/hostname" },
                        volumeSpec: {
                            persistentVolumeClaim: {
                                storageClassName: "longhorn",
                                resources: {
                                    requests: {
                                        storage: "7G"
                                    }
                                }
                            }
                        }
                    },
                    haproxy: { enabled: false },
                    proxysql: { enabled: false },
                    logcollector: {
                        enabled: false,
                        image: "percona/percona-xtradb-cluster-operator:1.13.0-logcollector",
                        imagePullPolicy: "IfNotPresent",
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                    },
                    pmm: {
                        enabled: true,
                        image: "percona/pmm-client:2.38.0",
                        imagePullPolicy: "IfNotPresent"
                    },
                    backup: {
                        allowParallel: false,
                        image: "percona/percona-xtradb-cluster-operator:1.13.0-pxc8.0-backup-pxb8.0.32",
                        imagePullPolicy: "IfNotPresent",
                        storages: {
                            "minio": {
                                type: "s3",
                                verifyTLS: true,
                                s3: {
                                    endpointUrl: "http://node30.node.home.local:9000",
                                    bucket: "backup",
                                    credentialsSecret: "archery-s3-credentials",
                                    region: "us-west-2"
                                }
                            }
                        },
                        pitr: {
                            enabled: true,
                            storageName: "minio",
                            timeBetweenUploads: 60
                        },
                        schedule: [
                            {
                                name: "daily-backup",
                                schedule: pulumi.interpolate`${minutes.result} ${hours.result} * * *`,
                                keep: 15,
                                storageName: "minio"
                            }
                        ]
                    }
                }
            }
        ],
        servicemonitors: [
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "artifactory-postgres",
                    namespace: "archery"
                },
                spec: {
                    podMetricsEndpoints: [
                        {
                            interval: "60s",
                            scrapeTimeout: "30s",
                            scheme: "http",
                            targetPort: "exporter",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { action: "replace", replacement: "demo", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "dev", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "Container-Registry", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "artifactory", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "dc01", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["artifactory"]
                    },
                    selector: {
                        matchLabels: {
                            "postgres-operator.crunchydata.com/cluster": "artifactory",
                            "postgres-operator.crunchydata.com/instance-set": "instance"
                        }
                    }
                }
            }
        ],
        helm: {
            namespace: "artifactory",
            name: "artifactory-oss",
            chart: "artifactory-oss",
            repository: "https://charts.jfrog.io",
            version: "107.55.8",
            values: {}
        }
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create Kubernetes Secret.
    for (var secret_index in deploy_spec[i].secret) {
        const secret = new k8s.core.v1.Secret(deploy_spec[i].secret[secret_index].metadata.name, {
            metadata: deploy_spec[i].secret[secret_index].metadata,
            type: deploy_spec[i].secret[secret_index].type,
            data: deploy_spec[i].secret[secret_index].data,
            stringData: deploy_spec[i].secret[secret_index].stringData
        }, { dependsOn: [namespace] });
    }
    // Create postgresql CRD.
    for (var crd_index in deploy_spec[i].crds) {
        const rules = new k8s.apiextensions.CustomResource(deploy_spec[i].crds[crd_index].metadata.name, {
            apiVersion: deploy_spec[i].crds[crd_index].apiVersion,
            kind: deploy_spec[i].crds[crd_index].kind,
            metadata: deploy_spec[i].crds[crd_index].metadata,
            spec: deploy_spec[i].crds[crd_index].spec
        }, { dependsOn: [namespace] });
    }
    // Create service monitor.
    //for (var servicemonitor_index in deploy_spec[i].servicemonitors) {
    //    const servicemonitor = new k8s.apiextensions.CustomResource(deploy_spec[i].servicemonitors[servicemonitor_index].metadata.name, {
    //        apiVersion: deploy_spec[i].servicemonitors[servicemonitor_index].apiVersion,
    //        kind: deploy_spec[i].servicemonitors[servicemonitor_index].kind,
    //        metadata: deploy_spec[i].servicemonitors[servicemonitor_index].metadata,
    //        spec: deploy_spec[i].servicemonitors[servicemonitor_index].spec
    //    }, { dependsOn: [namespace] });
    //}
    // Create Release Resource.
    //const helm = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
    //    namespace: deploy_spec[i].helm.namespace,
    //    name: deploy_spec[i].helm.name,
    //    chart: deploy_spec[i].helm.chart,
    //    version: deploy_spec[i].helm.version,
    //    values: deploy_spec[i].helm.values,
    //    skipAwait: true,
    //    repositoryOpts: {
    //        repo: deploy_spec[i].helm.repository,
    //    },
    //}, { dependsOn: [postgres] });
}