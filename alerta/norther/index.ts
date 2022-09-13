import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as random from "@pulumi/random";

const randomrandomstring = new random.RandomString("random", {
    keepers: { project: `${pulumi.getStack()}-${pulumi.getProject()}` },
    length: 32,
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
                        tag: "8.6.3"
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
                        DATABASE_URL: "'mongodb://alerta:password@alerta-psmdb-db-rs0-0.alerta-psmdb-db-rs0.mongodb.svc.cluster.local:27017,alerta-psmdb-db-rs0-0.alerta-psmdb-db-rs0.mongodb.svc.cluster.local:27017,alerta-psmdb-db-rs0-0.alerta-psmdb-db-rs0.mongodb.svc.cluster.local:27017/alerta?replicaSet=rs0&connectTimeoutMS=300000'",
                        DATABASE_NAME: "'alerta'",
                        DATABASE_RAISE_ON_ERROR: "False",
                        DELETE_EXPIRED_AFTER: 60,
                        DELETE_INFO_AFTER: 60,
                        COLUMNS: "['severity', 'status', 'type', 'lastReceiveTime', 'duplicateCount', 'customer', 'environment', 'group', 'resource', 'service', 'text']",
                        CORS_ORIGINS: "['https://alerta.example.com']",
                        AUTH_REQUIRED: "True",
                        SECRET_KEY: pulumi.interpolate`'${randomrandomstring.result}'`,
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
        }, { dependsOn: [namespace] });
    }
}

export const secretkey = randomrandomstring.result;