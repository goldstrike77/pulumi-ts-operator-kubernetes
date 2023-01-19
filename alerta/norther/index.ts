import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as random from "@pulumi/random";

const randomsecretkey = new random.RandomString("randomsecretkey", {
    keepers: { project: `${pulumi.getStack()}-${pulumi.getProject()}` },
    length: 32,
    special: false,
});

const randomreplicasetkey = new random.RandomString("randomreplicasetkey", {
    keepers: { project: `${pulumi.getStack()}-${pulumi.getProject()}` },
    length: 12,
    special: false,
});

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "alerta",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "alerta",
                name: "alerta",
                chart: "../../_chart/alerta.tgz",
                repository: "",
                version: "0.1",
                values: {
                    replicaCount: 1,
                    image: {
                        repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/alerta-web",
                        tag: "8.7.0"
                    },
                    ingress: {
                        enabled: true,
                        annotations: { "kubernetes.io/ingress.class": "nginx" },
                        hosts: ["alerta.example.com"]
                    },
                    resources: {
                        limits: { cpu: "1000m", memory: "1024Mi" },
                        requests: { cpu: "1000m", memory: "1024Mi" }
                    },
                    alertaAdminPassword: config.require("alertaAdminPassword"),
                    alertaAdminUsers: ["admin@alerta.io"],
                    alertaInstallPlugins: ["prometheus"],
                    alertaConfig: {
                        DATABASE_URL: "'mongodb://alerta:password@mongodb-0:27017,mongodb-1:27017,mongodb-2:27017/alerta?replicaSet=rs0-alerta&connectTimeoutMS=300000&tls=true&tlsAllowInvalidCertificates=true'",
                        DATABASE_NAME: "'alerta'",
                        DATABASE_RAISE_ON_ERROR: "False",
                        DELETE_EXPIRED_AFTER: 60,
                        DELETE_INFO_AFTER: 60,
                        COLUMNS: "['severity', 'status', 'type', 'lastReceiveTime', 'duplicateCount', 'customer', 'environment', 'group', 'resource', 'service', 'text']",
                        CORS_ORIGINS: "['https://alerta.example.com']",
                        AUTH_REQUIRED: "True",
                        SECRET_KEY: pulumi.interpolate`'${randomsecretkey.result}'`,
                        CUSTOMER_VIEWS: "True",
                        BASE_URL: "''",
                        USE_PROXYFIX: "False",
                        AUTH_PROVIDER: "'basic'",
                        ADMIN_USERS: "['admin@alerta.io']",
                        SIGNUP_ENABLED: "False",
                        SITE_LOGO_URL: "''",
                        SEVERITY_MAP: "{'critical':1,'high':2,'warning':3,'info':4,'ok':5}",
                        DEFAULT_NORMAL_SEVERITY: "'ok'",
                        DEFAULT_PREVIOUS_SEVERITY: "'ok'",
                        COLOR_MAP: "{'severity':{'critical':'red','high':'yellow','warning':'gray','info':'white','ok':'#00CC00'},'text':'black','highlight':'skyblue'}",
                        DEBUG: "False",
                        LOG_HANDLERS: "['console']",
                        LOG_FORMAT: "'verbose'",
                        ALLOWED_ENVIRONMENTS: "['dev', 'development', 'disaster', 'drs', 'prd', 'nprd', 'production', 'qa', 'sit', 'testing', 'uat']",
                        DEFAULT_ENVIRONMENT: "'dev'",
                        PLUGINS: "['prometheus']",
                        PLUGINS_RAISE_ON_ERROR: "False",
                        ALERTMANAGER_API_URL: "'demo-prd-infra-monitor-alertmanager.service.dc01.local:9093'",
                        ALERTMANAGER_SILENCE_DAYS: 5,
                        ALERTMANAGER_SILENCE_FROM_ACK: "True"
                    },
                    postgresql: { enabled: false }
                }
            },
            {
                namespace: "alerta",
                name: "mongodb",
                chart: "mongodb",
                repository: "https://charts.bitnami.com/bitnami",
                version: "13.6.2",
                values: {
                    image: {
                        tag: "4.4.15-debian-10-r8"
                    },
                    architecture: "replicaset",
                    auth: {
                        rootUser: "root",
                        rootPassword: config.require("rootPassword"),
                        username: "alerta",
                        password: config.require("alertaPassword"),
                        database: "alerta",
                        replicaSetKey: pulumi.interpolate`'${randomreplicasetkey.result}'`,
                    },
                    tls: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    replicaSetName: "rs0-alerta",
                    directoryPerDB: true,
                    systemLogVerbosity: 0,
                    disableSystemLog: true,
                    enableJournal: true,
                    replicaCount: 3,
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    resources: {
                        limits: { cpu: "500m", memory: "1024Mi" },
                        requests: { cpu: "500m", memory: "1024Mi" }
                    },
                    persistence: {
                        storageClass: "longhorn",
                        size: "8Gi"
                    },
                    arbiter: { enabled: false },
                    metrics: {
                        enabled: true,
                        username: "root",
                        password: "",
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        serviceMonitor: {
                            enabled: true,
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        },
                        prometheusRule: {
                            enabled: false,
                            rules: []
                        }
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
        if (deploy_spec[i].helm[helm_index].repository === "") {
            const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
                namespace: deploy_spec[i].helm[helm_index].namespace,
                name: deploy_spec[i].helm[helm_index].name,
                chart: deploy_spec[i].helm[helm_index].chart,
                version: deploy_spec[i].helm[helm_index].version,
                values: deploy_spec[i].helm[helm_index].values,
                skipAwait: true,
            }, { dependsOn: [namespace] });
        }
        else {
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
}