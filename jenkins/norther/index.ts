import * as k8s from "@pulumi/kubernetes";

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
                        resources: {
                            limits: { cpu: "2000m", memory: "6144Mi" },
                            requests: { cpu: "2000m", memory: "6144Mi" }
                        },
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
                        resources: {
                            limits: { cpu: "500m", memory: "512Mi" },
                            requests: { cpu: "500m", memory: "512Mi" }
                        }
                    },
                    persistence: { enabled: true, storageClass: "longhorn", size: "8Gi" }
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