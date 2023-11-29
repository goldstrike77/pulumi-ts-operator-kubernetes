import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const podlabels = {
  customer: "demo",
  environment: "dev",
  project: "SEIM",
  group: "Opensearch",
  datacenter: "dc01",
  domain: "local"
}

const resources = [
  {
    namespace: {
      metadata: {
        name: "opensearch",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    secret: [
      {
        metadata: {
          name: "client-access-key",
          namespace: "opensearch",
          annotations: {},
          labels: {}
        },
        type: "Opaque",
        data: { "s3.client.default.access_key": Buffer.from(config.require("AWS_ACCESS_KEY_ID")).toString('base64') },
        stringData: {}
      },
      {
        metadata: {
          name: "client-secret-key",
          namespace: "opensearch",
          annotations: {},
          labels: {}
        },
        type: "Opaque",
        data: { "s3.client.default.secret_key": Buffer.from(config.require("AWS_SECRET_ACCESS_KEY")).toString('base64') },
        stringData: {}
      }
    ],
    release: [
      {
        namespace: "opensearch",
        name: "master",
        version: "2.16.1",
        chart: "opensearch",
        repositoryOpts: {
          repo: "https://opensearch-project.github.io/helm-charts"
        },
        values: {
          clusterName: "opensearch",
          nodeGroup: "master",
          masterService: "opensearch-master",
          roles: ["master", "ingest", "remote_cluster_client"],
          replicas: 1,
          config: {
            "opensearch.yml": `---
cluster:
  name: opensearch
  max_shards_per_node: 10000
http:
  compression: false
  cors:
    enabled: true
    allow-origin: "*"
    allow-credentials: true
    allow-methods: HEAD, GET, POST, PUT, DELETE
    allow-headers: "X-Requested-With, X-Auth-Token, Content-Type, Content-Length, Authorization, Access-Control-Allow-Headers, Accept"
s3:
  client:
    default:
      endpoint: storage.node.home.local:9000
      protocol: http
      region: us-east-1
      path_style_access: true
      read_timeout: 10s
      max_retries: 5
network.host: 0.0.0.0
plugins:
  security:
    ssl:
      transport:
        pemcert_filepath: esnode.pem
        pemkey_filepath: esnode-key.pem
        pemtrustedcas_filepath: root-ca.pem
        enforce_hostname_verification: false
        resolve_hostname: false
      http:
        enabled: true
        clientauth_mode: NONE
        pemcert_filepath: esnode.pem
        pemkey_filepath: esnode-key.pem
        pemtrustedcas_filepath: root-ca.pem
    allow_unsafe_democertificates: true
    allow_default_init_securityindex: true
    authcz:
      admin_dn:
        - CN=kirk,OU=client,O=client,L=test,C=de
    audit.type: internal_opensearch
    enable_snapshot_restore_privilege: true
    check_snapshot_restore_write_privileges: true
    restapi:
      roles_enabled: ["all_access", "security_rest_api_access"]
    system_indices:
      enabled: true
      indices: [".opendistro-alerting-config",".opendistro-alerting-alert*",".opendistro-anomaly-results*",".opendistro-anomaly-detector*",".opendistro-anomaly-checkpoints",".opendistro-anomaly-detection-state",".opendistro-reports-*",".opendistro-notifications-*",".opendistro-notebooks",".opendistro-asynchronous-search-response*"]
`
          },
          image: {
            repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/opensearch",
            tag: "2.11.0"
          },
          labels: podlabels,
          opensearchJavaOpts: "-server -Xmx3072M -Xms3072M",
          resources: {
            limits: { cpu: "1000m", memory: "4096Mi" },
            requests: { cpu: "1000m", memory: "4096Mi" }
          },
          initResources: {
            limits: { cpu: "200m", memory: "128Mi" },
            requests: { cpu: "200m", memory: "128Mi" }
          },
          persistence: { enabled: true, enableInitChown: true, storageClass: "vsphere-san-sc", size: "3Gi", },
          extraInitContainers: [
            {
              name: "sysctl",
              image: "docker.io/bitnami/bitnami-shell:10-debian-10",
              imagePullPolicy: "IfNotPresent",
              command: [
                "/bin/bash",
                "-ec",
                "sysctl -w vm.max_map_count=262144;",
                "sysctl -w fs.file-max=65536;"
              ],
              securityContext: { runAsUser: 0, privileged: true }
            }
          ],
          securityConfig: {
            path: "/usr/share/opensearch/config/opensearch-security",
            config: {
              dataComplete: false,
              data: {
                "internal_users.yml": `---
_meta:
  type: "internalusers"
  config_version: 2
admin:
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
  reserved: true
  backend_roles:
  - "admin"
  description: "Demo admin user"
kibanaserver:
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
  reserved: true
  description: "Demo OpenSearch Dashboards user"
kibanaro:
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
  reserved: false
  backend_roles:
  - "kibanauser"
  - "readall"
  attributes:
    attribute1: "value1"
    attribute2: "value2"
    attribute3: "value3"
  description: "Demo OpenSearch Dashboards read only user"
logstash:
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
  reserved: false
  backend_roles:
  - "logstash"
  description: "Demo logstash user"
readall:
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
  reserved: false
  backend_roles:
  - "readall"
  description: "Demo readall user"
snapshotrestore:
  hash: "$2y$12$Y1rgnv5glUOVx.SzRTcGCe5/3XNrXfCbq.0bk6yjcl7/tHrXR29qO"
  reserved: false
  backend_roles:
  - "snapshotrestore"
  description: "Demo snapshotrestore user"
`,
                "config.yml": `---
_meta:
  type: "config"
  config_version: 2

config:
  dynamic:
    http:
      anonymous_auth_enabled: false
      xff:
        enabled: false
        internalProxies: '.*'
        remoteIpHeader:  'x-forwarded-for'
    authc:
      basic_internal_auth_domain:
        description: "Authenticate via HTTP Basic against internal users database"
        http_enabled: true
        transport_enabled: true
        order: 1
        http_authenticator:
          type: basic
          challenge: true
        authentication_backend:
          type: internal
      openid_auth_domain:
        http_enabled: true
        transport_enabled: true
        order: 0
        http_authenticator:
          type: openid
          challenge: false
          config:
            subject_key: name
            roles_key: roles
            openid_connect_url: https://login.microsoftonline.com/1028c8b9-5db4-4ade-bd31-524340b7cc0d/v2.0/.well-known/openid-configuration
        authentication_backend:
          type: noop
`
              }
            }
          },
          terminationGracePeriod: "60",
          plugins: {
            enabled: true,
            installList: ["repository-s3"]
          },
          keystore: [
            { secretName: "client-access-key" },
            { secretName: "client-secret-key" }
          ]
        }
      },
      {
        namespace: "opensearch",
        name: "node",
        version: "2.16.1",
        chart: "opensearch",
        repositoryOpts: {
          repo: "https://opensearch-project.github.io/helm-charts"
        },
        values: {
          clusterName: "opensearch",
          nodeGroup: "data",
          masterService: "opensearch-master",
          roles: ["data"],
          replicas: 2,
          config: {
            "opensearch.yml": `---
cluster:
  name: opensearch
  max_shards_per_node: 10000
http:
  compression: false
  cors:
    enabled: true
    allow-origin: "*"
    allow-credentials: true
    allow-methods: HEAD, GET, POST, PUT, DELETE
    allow-headers: "X-Requested-With, X-Auth-Token, Content-Type, Content-Length, Authorization, Access-Control-Allow-Headers, Accept"
s3:
  client:
    default:
      endpoint: storage.node.home.local:9000
      protocol: http
      region: us-east-1
      path_style_access: true
      read_timeout: 10s
      max_retries: 5
network.host: 0.0.0.0
plugins:
  security:
    ssl:
      transport:
        pemcert_filepath: esnode.pem
        pemkey_filepath: esnode-key.pem
        pemtrustedcas_filepath: root-ca.pem
        enforce_hostname_verification: false
        resolve_hostname: false
      http:
        enabled: true
        clientauth_mode: NONE
        pemcert_filepath: esnode.pem
        pemkey_filepath: esnode-key.pem
        pemtrustedcas_filepath: root-ca.pem
    allow_unsafe_democertificates: true
    allow_default_init_securityindex: true
    authcz:
      admin_dn:
        - CN=kirk,OU=client,O=client,L=test,C=de
    audit.type: internal_opensearch
    enable_snapshot_restore_privilege: true
    check_snapshot_restore_write_privileges: true
    restapi:
      roles_enabled: ["all_access", "security_rest_api_access"]
    system_indices:
      enabled: true
      indices: [".opendistro-alerting-config",".opendistro-alerting-alert*",".opendistro-anomaly-results*",".opendistro-anomaly-detector*",".opendistro-anomaly-checkpoints",".opendistro-anomaly-detection-state",".opendistro-reports-*",".opendistro-notifications-*",".opendistro-notebooks",".opendistro-asynchronous-search-response*"]
`
          },
          image: {
            repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/opensearch",
            tag: "2.11.0"
          },
          labels: podlabels,
          opensearchJavaOpts: "-server -Xmx8192M -Xms8192M",
          resources: {
            limits: { cpu: "2000m", memory: "10240Mi" },
            requests: { cpu: "2000m", memory: "10240Mi" }
          },
          initResources: {
            limits: { cpu: "200m", memory: "128Mi" },
            requests: { cpu: "200m", memory: "128Mi" }
          },
          persistence: { enabled: true, enableInitChown: true, storageClass: "vsphere-san-sc", size: "31Gi" },
          extraInitContainers: [
            {
              name: "sysctl",
              image: "docker.io/bitnami/bitnami-shell:10-debian-10",
              imagePullPolicy: "IfNotPresent",
              command: [
                "/bin/bash",
                "-ec",
                "sysctl -w vm.max_map_count=262144;",
                "sysctl -w fs.file-max=65536;"
              ],
              securityContext: { runAsUser: 0, privileged: true }
            }
          ],
          terminationGracePeriod: "60",
          plugins: {
            enabled: true,
            installList: ["repository-s3"]
          },
          keystore: [
            { secretName: "client-access-key" },
            { secretName: "client-secret-key" }
          ]
        }
      },
      {
        namespace: "opensearch",
        name: "dashboards",
        version: "2.14.0",
        chart: "opensearch-dashboards",
        repositoryOpts: {
          repo: "https://opensearch-project.github.io/helm-charts"
        },
        values: {
          opensearchHosts: "https://opensearch-master:9200",
          replicaCount: 1,
          fullnameOverride: "opensearch-dashboards",
          config: {
            "opensearch_dashboards.yml": `
---
logging.quiet: true
opensearch.password: ${config.require("kibanaserverPassword")}
opensearch.requestHeadersAllowlist: [authorization, securitytenant] 
opensearch.ssl.verificationMode: none
opensearch.username: kibanaserver
opensearch_security.auth.multiple_auth_enabled: true
opensearch_security.auth.type: ["openid", "basicauth"]
opensearch_security.cookie.secure: false
opensearch_security.multitenancy.enabled: true
opensearch_security.multitenancy.tenants.preferred: [Private, Global]
opensearch_security.openid.base_redirect_url: "https://opensearch.example.com"
opensearch_security.openid.client_id: "4573f7a0-e878-4d29-935f-ac4b57983daf"
opensearch_security.openid.client_secret: ${config.require("ssoClientSecret")}
opensearch_security.openid.connect_url: "https://login.microsoftonline.com/1028c8b9-5db4-4ade-bd31-524340b7cc0d/v2.0/.well-known/openid-configuration"
opensearch_security.openid.logout_url: "https://opensearch.example.com/app/login?"
opensearch_security.readonly_mode.roles: [kibana_read_only]
opensearch_security.ui.openid.login.buttonname: "Sign in with Microsoft"
server.host: '0.0.0.0'
server.ssl.clientAuthentication: none
server.ssl.enabled: false
`,
          },
          labels: podlabels,
          ingress: {
            enabled: true,
            annotations: { "nginx.ingress.kubernetes.io/backend-protocol": "HTTP" },
            ingressClassName: "nginx",
            hosts: [
              {
                host: "opensearch.example.com",
                paths: [
                  {
                    path: "/",
                    backend: {
                      serviceName: "opensearch-dashboards",
                      servicePort: 5601
                    }
                  }
                ]
              }
            ]
          },
          resources: {
            limits: { cpu: "500m", memory: "512Mi" },
            requests: { cpu: "500m", memory: "512Mi" }
          },
        }
      },
      {
        namespace: "opensearch",
        name: "elasticsearch-exporter",
        version: "5.3.1",
        chart: "prometheus-elasticsearch-exporter",
        repositoryOpts: {
          repo: "https://prometheus-community.github.io/helm-charts"
        },
        values: {
          fullnameOverride: "opensearch-exporter",
          log: { level: "wran" },
          resources: {
            limits: { cpu: "100m", memory: "64Mi" },
            requests: { cpu: "100m", memory: "64Mi" }
          },
          podLabels: podlabels,
          es: {
            uri: "https://admin:" + config.require("adminPassword") + "@opensearch-master:9200",
            all: false,
            indices: true,
            indices_settings: true,
            indices_mappings: true,
            shards: true,
            snapshots: true,
            cluster_settings: true,
            timeout: "30s",
            sslSkipVerify: true
          },
          serviceMonitor: {
            enabled: true,
            interval: "60s",
            scrapeTimeout: "30s",
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
        }
      }
    ]
  }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [secret] });