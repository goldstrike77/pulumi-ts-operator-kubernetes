import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "artifactory",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: {
            namespace: "artifactory",
            name: "artifactory-oss",
            chart: "artifactory-oss",
            repository: "https://charts.jfrog.io",
            version: "107.55.8",
            values: {
                artifactory: {
                    fullnameOverride: "artifactory",
                    artifactory: {
                        resources: {
                            limits: { cpu: "1000m", memory: "6144Mi" },
                            requests: { cpu: "1000m", memory: "6144Mi" }
                        },
                        javaOpts: {
                            xms: "4g",
                            xmx: "4g"
                        },
                        persistence: {
                            type: "aws-s3-v3",
                            awsS3V3: {
                                identity: "artifactory",
                                credential: config.require("AWS_SECRET_ACCESS_KEY"),
                                region: "us-east-1",
                                bucketName: "artifactory",
                                path: "artifactory/filestore",
                                endpoint: "minio.minio:9000",
                                useHttp: true
                            }
                        }
                    },
                    ingress: {
                        enabled: true,
                        hosts: ["norther.example.com"],
                        routerPath: "/jfrog",
                        artifactoryPath: "/artifactory/",
                        className: "nginx"
                    },
                    postgresql: { enabled: true },
                    jfconnect: { enabled: false }
                },
                postgresql: { enabled: true }
            }
        }
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create Release Resource.
    const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
        namespace: deploy_spec[i].helm.namespace,
        name: deploy_spec[i].helm.name,
        chart: deploy_spec[i].helm.chart,
        version: deploy_spec[i].helm.version,
        values: deploy_spec[i].helm.values,
        skipAwait: true,
        repositoryOpts: {
            repo: deploy_spec[i].helm.repository,
        },
    }, { dependsOn: [namespace] });
}