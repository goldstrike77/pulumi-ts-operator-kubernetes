import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const podlabels = {
  customer: "it",
  environment: "prd",
  project: "SEIM",
  group: "Opensearch",
  datacenter: "cn-north",
  domain: "local"
}

const resources = [
  {
    namespace: [
      {
        metadata: {
          name: "opensearch",
          annotations: {},
          labels: {
            "pod-security.kubernetes.io/enforce": "privileged",
            "pod-security.kubernetes.io/audit": "privileged",
            "pod-security.kubernetes.io/warn": "privileged"
          }
        },
        spec: {}
      }
    ],
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
        version: "2.24.0",
        chart: "opensearch",
        repositoryOpts: {
          repo: "https://opensearch-project.github.io/helm-charts"
        },
        values: {
          nodeGroup: "master",
          roles: ["master", "ingest", "remote_cluster_client"],
          replicas: 3,
          config: {
            "opensearch.yml": `---
cluster:
  name: opensearch-cluster
  max_shards_per_node: 10000
network:
  host: 0.0.0.0
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
      endpoint: obs.home.local
      protocol: http
      region: us-east-1
      path_style_access: true
      read_timeout: 10s
      max_retries: 5
plugins:
  security:
    ssl:
      transport:
        pemcert_filepath: esnode.pem
        pemkey_filepath: esnode-key.pem
        pemtrustedcas_filepath: root-ca.pem
        enforce_hostname_verification: false
      http:
        enabled: true
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
          extraEnvs: [
            {
              name: "OPENSEARCH_INITIAL_ADMIN_PASSWORD",
              value: config.require("adminPassword")
            }
          ],
          image: {
            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/opensearch",
            tag: "2.16.0-s3"
          },
          labels: podlabels,
          opensearchJavaOpts: "-server -Xmx4096M -Xms4096M",
          resources: {
            limits: { cpu: "1000m", memory: "6144Mi" },
            requests: { cpu: "1000m", memory: "6144Mi" }
          },
          initResources: {
            limits: { cpu: "200m", memory: "128Mi" },
            requests: { cpu: "200m", memory: "128Mi" }
          },
          persistence: {
            enabled: true,
            enableInitChown: true,
            image: "swr.cn-east-3.myhuaweicloud.com/docker-io/busybox",
            imageTag: "1.36.1",
            storageClass: "vsphere-san-sc",
            size: "3Gi"
          },
          extraInitContainers: [
            {
              name: "sysctl",
              image: "swr.cn-east-3.myhuaweicloud.com/docker-io/os-shell:12-debian-12-r22",
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
          service: {
            type: "LoadBalancer",
            annotations: { "metallb.universe.tf/allow-shared-ip": "shared" }
          },
          securityConfig: {
            path: "/usr/share/opensearch/config/opensearch-security",
            config: {
              dataComplete: false,
              data: {
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
            openid_connect_url: https://login.microsoftonline.com/e824e20c-c5d7-4a69-adb1-3494404763a5/v2.0/.well-known/openid-configuration
        authentication_backend:
          type: noop
`
              }
            }
          },
          startupProbe: {
            initialDelaySeconds: 120,
            periodSeconds: 30,
            timeoutSeconds: 3,
            failureThreshold: 30
          },
          /**
          plugins: {
            enabled: true,
            installList: ["repository-s3"]
          },
           */
          serviceMonitor: {
            enabled: true,
            interval: "60s"
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
        version: "2.24.0",
        chart: "opensearch",
        repositoryOpts: {
          repo: "https://opensearch-project.github.io/helm-charts"
        },
        values: {
          nodeGroup: "data",
          roles: ["data"],
          replicas: 2,
          config: {
            "opensearch.yml": `---
cluster:
  name: opensearch-cluster
  max_shards_per_node: 10000
network:
  host: 0.0.0.0
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
      endpoint: obs.home.local
      protocol: http
      region: us-east-1
      path_style_access: true
      read_timeout: 10s
      max_retries: 5
plugins:
  security:
    ssl:
      transport:
        pemcert_filepath: esnode.pem
        pemkey_filepath: esnode-key.pem
        pemtrustedcas_filepath: root-ca.pem
        enforce_hostname_verification: false
      http:
        enabled: true
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
          extraEnvs: [
            {
              name: "OPENSEARCH_INITIAL_ADMIN_PASSWORD",
              value: config.require("adminPassword")
            }
          ],
          image: {
            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/opensearch",
            tag: "2.16.0-s3"
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
          persistence: {
            enabled: true,
            enableInitChown: true,
            image: "swr.cn-east-3.myhuaweicloud.com/docker-io/busybox",
            imageTag: "1.36.1",
            storageClass: "vsphere-san-sc",
            size: "63Gi"
          },
          extraInitContainers: [
            {
              name: "sysctl",
              image: "swr.cn-east-3.myhuaweicloud.com/docker-io/os-shell:12-debian-12-r22",
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
          /**
          plugins: {
            enabled: true,
            installList: ["repository-s3"]
          },
           */
          serviceMonitor: {
            enabled: true,
            interval: "60s"
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
        version: "2.22.0",
        chart: "opensearch-dashboards",
        repositoryOpts: {
          repo: "https://opensearch-project.github.io/helm-charts"
        },
        values: {
          replicaCount: 1,
          image: {
            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/opensearch-dashboards"
          },
          fullnameOverride: "opensearch-dashboards",
          config: {
            "opensearch_dashboards.yml": `
---
logging.quiet: true
opensearch.password: ${config.require("adminPassword")}
opensearch.requestHeadersAllowlist: [authorization, securitytenant] 
opensearch.ssl.verificationMode: none
opensearch.username: admin
opensearch_security.auth.multiple_auth_enabled: true
opensearch_security.auth.type: ["openid", "basicauth"]
opensearch_security.cookie.secure: false
opensearch_security.multitenancy.enabled: true
opensearch_security.multitenancy.tenants.preferred: [Private, Global]
opensearch_security.openid.base_redirect_url: "https://opensearch.home.local"
opensearch_security.openid.client_id: "44865121-82d9-4c44-a9e3-417fbd1bacf8"
opensearch_security.openid.client_secret: ${config.require("ssoClientSecret")}
opensearch_security.openid.connect_url: "https://login.microsoftonline.com/e824e20c-c5d7-4a69-adb1-3494404763a5/v2.0/.well-known/openid-configuration"
opensearch_security.openid.logout_url: "https://opensearch.home.local/app/login?"
opensearch_security.readonly_mode.roles: [kibana_read_only]
opensearch_security.ui.openid.login.buttonname: "Sign in with Microsoft Entra ID"
server.host: '0.0.0.0'
server.ssl.clientAuthentication: none
server.ssl.enabled: false
`,
          },
          labels: podlabels,
          ingress: { enabled: false },
          resources: {
            limits: { cpu: "500m", memory: "512Mi" },
            requests: { cpu: "500m", memory: "512Mi" }
          },
          serviceMonitor: {
            enabled: true,
            interval: "60s"
          },
        }
      }
    ],
    customresource: [
      {
        apiVersion: "apisix.apache.org/v2",
        kind: "ApisixRoute",
        metadata: {
          name: "opensearch-dashboards",
          namespace: "opensearch"
        },
        spec: {
          http: [
            {
              name: "root",
              match: {
                methods: ["GET", "HEAD", "POST", "PUT"],
                hosts: ["opensearch.home.local"],
                paths: ["/*"]
              },
              backends: [
                {
                  serviceName: "opensearch-dashboards",
                  servicePort: 5601,
                  resolveGranularity: "service"
                }
              ]
            }
          ]
        }
      }
    ]
  }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [secret] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [namespace] });