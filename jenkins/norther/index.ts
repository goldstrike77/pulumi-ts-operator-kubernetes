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
        helm:
        {
            namespace: "jenkins",
            name: "jenkins",
            chart: "jenkins",
            repository: "https://charts.jenkins.io",
            version: "4.3.20",
            values: {
                controller: {
                    image: "registry.cn-hangzhou.aliyuncs.com/goldstrike/jenkins",
                    tag: "2.387.2-jdk11",
                    imagePullPolicy: "IfNotPresent",
                    numExecutors: 1,
                    adminUser: "admin",
                    adminPassword: config.require("adminPassword"),
                    resources: {
                        limits: { cpu: "2000m", memory: "6144Mi" },
                        requests: { cpu: "2000m", memory: "6144Mi" }
                    },
                    initContainerEnv: [
                        { name: "JENKINS_UC_DOWNLOAD", value: "https://mirrors.aliyun.com/jenkins" },
                        { name: "JENKINS_UC", value: "https://mirrors.aliyun.com/jenkins/updates/stable/update-center.json" },
                        { name: "JENKINS_UC_EXPERIMENTAL", value: "https://mirrors.aliyun.com/jenkins/updates/experimental/update-center.json" }
                    ],
                    podLabels: { customer: "demo", environment: "dev", project: "CICD", group: "Jenkins", datacenter: "dc01", domain: "local" },
                    javaOpts: "-XX:+UseContainerSupport -XX:MaxRAMPercentage=80 -server -Djenkins.install.runSetupWizard=false -Dhudson.model.ParametersAction.keepUndefinedParameters=true",
                    jenkinsUrlProtocol: "https",
                    jenkinsUrl: "https://norther.example.com/jenkins/",
                    jenkinsUriPrefix: "/jenkins",
                    installPlugins: [
                        "active-directory:2.30",
                        "cloudbees-disk-usage-simple:178.v1a_4d2f6359a_8",
                        "configuration-as-code:1569.vb_72405b_80249",
                        "git:5.0.0",
                        "github:1.37.0",
                        "kubernetes:3909.v1f2c633e8590",
                        "ldap:671.v2a_9192a_7419d",
                        "prometheus:2.1.1",
                        "skip-certificate-check:1.1",
                        "workflow-aggregator:596.v8c21c963d92d",
                        "pipeline-model-api:2.2125.vddb_a_44a_d605e",
                        "workflow-job:1289.vd1c337fd5354"
                    ],
                    installLatestPlugins: false,
                    initializeOnce: true,
                    additionalPlugins: [
                        "ansible:174.vfd5323d2b_9d8",
                        "nodejs:1.6.0",
                        "saml:4.385.v4dea_91565e9d"
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
                        hostName: "norther.example.com",
                        annotations: {
                            "nginx.ingress.kubernetes.io/proxy-body-size": "10m"
                        }
                    },
                    prometheus: {
                        enabled: true,
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                        ]
                    }
                },
                agent: {
                    enabled: true,
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
                    onlyJobs: true
                }
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