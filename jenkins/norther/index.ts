import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as random from "@pulumi/random";

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

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "jenkins",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "jenkins",
                name: "jenkins",
                chart: "jenkins",
                repository: "https://charts.jenkins.io",
                version: "4.1.17",
                values: {
                    controller: {
                        image: "registry.cn-hangzhou.aliyuncs.com/goldstrike/jenkins",
                        tag: "2.346.3-jdk11",
                        imagePullPolicy: "IfNotPresent",
                        numExecutors: 1,
                        adminUser: "admin",
                        adminPassword: config.require("adminPassword"),
                        resources: {
                            limits: { cpu: "1000m", memory: "6144Mi" },
                            requests: { cpu: "1000m", memory: "6144Mi" }
                        },
                        initContainerEnv: [
                            { name: "JENKINS_UC_DOWNLOAD", value: "https://mirrors.aliyun.com/jenkins" },
                            { name: "JENKINS_UC", value: "https://mirrors.aliyun.com/jenkins/updates/stable/update-center.json" },
                            { name: "JENKINS_UC_EXPERIMENTAL", value: "https://mirrors.aliyun.com/jenkins/updates/experimental/update-center.json" }
                        ],
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        javaOpts: "-XX:+UseContainerSupport -XX:MaxRAMPercentage=90 -server -Djenkins.install.runSetupWizard=false -Dhudson.model.ParametersAction.keepUndefinedParameters=true",
                        jenkinsUriPrefix: "/jenkins",
                        installPlugins: [
                            "active-directory",
                            "cloudbees-disk-usage-simple",
                            "configuration-as-code",
                            "git",
                            "github",
                            "kubernetes",
                            "ldap",
                            "prometheus",
                            "skip-certificate-check",
                            "workflow-aggregator"
                        ],
                        additionalPlugins: [
                            "ansible",
                            "nodejs"
                        ],
                        JCasC: {
                            defaultConfig: true,
                            configScripts: {
                                settings: `jenkins:
  noUsageStatistics: true
  updateCenter:
    sites:
    - id: "default"
      url: "https://updates.jenkins.io/stable/update-center.json"
`
                            }
                        },
                        sidecars: {
                            configAutoReload: {
                                resources: {
                                    limits: { cpu: "50m", memory: "100Mi" },
                                    requests: { cpu: "50m", memory: "100Mi" }
                                }
                            }
                        },
                        ingress: {
                            enabled: true,
                            ingressClassName: "nginx",
                            path: "/jenkins",
                            hostName: "norther.example.com"
                        },
                        prometheus: { enabled: true }
                    },
                    agent: {
                        enabled: true,
                        image: "registry.cn-hangzhou.aliyuncs.com/goldstrike/inbound-agent",
                        tag: "4.11.2-4",
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        }
                    },
                    persistence: { enabled: true, storageClass: "longhorn", size: "8Gi" },
                    backup: {
                        enabled: true,
                        schedule: pulumi.interpolate`${minutes.result} ${hours.result} * * *`,
                        activeDeadlineSeconds: "3600",
                        env: [
                            { name: "AWS_ACCESS_KEY_ID", value: config.require("AWS_ACCESS_KEY_ID"), },
                            { name: "AWS_SECRET_ACCESS_KEY", value: config.require("AWS_SECRET_ACCESS_KEY"), },
                            { name: "AWS_REGION", value: "us-east-1" },
                            { name: "AWS_S3_NO_SSL", value: "true" },
                            { name: "AWS_S3_FORCE_PATH_STYLE", value: "true" },
                            { name: "AWS_S3_ENDPOINT", value: "http://minio.minio.svc.cluster.local:9000" }
                        ],
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        },
                        destination: "s3://backup/jenkins",
                        onlyJobs: false
                    }
                }
            }
        ]
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create Release Resource.
    for (var helm_index in deploy_spec[i].helm) {
        const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
            namespace: deploy_spec[i].helm[helm_index].namespace,
            name: deploy_spec[i].helm[helm_index].name,
            chart: deploy_spec[i].helm[helm_index].chart,
            version: deploy_spec[i].helm[helm_index].version,
            values: deploy_spec[i].helm[helm_index].values,
            skipAwait: true,
            repositoryOpts: {
                repo: deploy_spec[i].helm[helm_index].repository,
            },
        }, { dependsOn: [namespace] });
    }
}