import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
  {
    namespace: {
      metadata: {
        name: "opensearch",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    helm: [
      {
        namespace: "opensearch",
        name: "master",
        version: "2.6.2",
        chart: "opensearch",
        repository: "https://opensearch-project.github.io/helm-charts",
        values: {
          clusterName: "opensearch",
          nodeGroup: "master",
          masterService: "opensearch-master",
          roles: ["master", "ingest", "remote_cluster_client"],
          replicas: 3,
          config: {
            "opensearch.yml": `
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
        enabled_protocols:
          [
            "TLSv1.2"
          ]
        enabled_ciphers:
          [
            "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
            "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256",
            "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
            "TLS_RSA_WITH_AES_128_CBC_SHA256",
            "TLS_RSA_WITH_AES_128_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384",
            "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384",
            "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_RSA_WITH_AES_256_CBC_SHA256",
            "TLS_RSA_WITH_AES_256_CBC_SHA",
          ]
      http:
        enabled: false
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
      indices:
        [
          ".opendistro-alerting-config",
          ".opendistro-alerting-alert*",
          ".opendistro-anomaly-results*",
          ".opendistro-anomaly-detector*",
          ".opendistro-anomaly-checkpoints",
          ".opendistro-anomaly-detection-state",
          ".opendistro-reports-*",
          ".opendistro-notifications-*",
          ".opendistro-notebooks",
          ".opendistro-asynchronous-search-response*"
        ]
`
          },
          labels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
          opensearchJavaOpts: "-server -Xmx1536M -Xms1536M",
          resources: {
            limits: { cpu: "500m", memory: "2048Mi" },
            requests: { cpu: "500m", memory: "2048Mi" }
          },
          initResources: {
            limits: { cpu: "25m", memory: "128Mi" },
            requests: { cpu: "25m", memory: "128Mi" }
          },
          persistence: { enabled: true, storageClass: "longhorn", size: "3Gi", },
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
/**
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
    authc:
      basic_internal_auth_domain:
        http_enabled: true
        transport_enabled: true
        order: 4
        http_authenticator:
          type: basic
          challenge: true
        authentication_backend:
          type: intern
      ldap:
        http_enabled: true
        transport_enabled: true
        order: 5
        http_authenticator:
          type: basic
          challenge: false
        authentication_backend:
          type: ldap
          config:
            enable_ssl: false
            enable_start_tls: false
            enable_ssl_client_auth: false
            verify_hostnames: false
            hosts:
              - 10.101.4.46:389
            bind_dn: 'cn=Administrator,cn=users,dc=example,dc=com'
            password: "${config.require("ladpPassword")}"
            userbase: 'ou=Users,dc=example,dc=com'
            usersearch: '(sAMAccountName={0})'
            username_attribute: uid
    authz:
      ldap:
        http_enabled: true
        transport_enabled: true
        authorization_backend:
          type: ldap
          config:
            enable_ssl: false
            enable_start_tls: false
            enable_ssl_client_auth: false
            verify_hostnames: false
            hosts:
              - 10.101.4.46:389
            bind_dn: 'cn=Administrator,cn=users,dc=example,dc=com'
            password: "${config.require("ladpPassword")}"
            rolebase: 'ou=groups,dc=example,dc=com'
            rolesearch: '(member={0})'
            userroleattribute: null
            userrolename: "memberOf"
            rolename: cn
            resolve_nested_roles: true
            userbase: 'dc=example,dc=com'
            usersearch: '(uid={0})'
      skip_users:
              - admin
              - kibanaserver
              - kibanaro
              - logstash
              - readall
              - snapshotrestore
`,
 */
                "internal_users.yml": `---
_meta:
  type: "internalusers"
  config_version: 2
admin:
  hash: "$2a$12$UDizTi1M0bOKPIIjIoE0G.I8zpfsTM1kY8LvcO8lnN8WqjkYDphMe"
  reserved: true
  backend_roles:
  - "admin"
  description: "Demo admin user"
kibanaserver:
  hash: "$2a$12$Vl4MI3s1r3wFx.LPuklpMOHRayUgoRDCqu3zSz5zbOqFrLo5FVo5."
  reserved: true
  description: "Demo OpenSearch Dashboards user"
kibanaro:
  hash: "$2a$12$CvASrNE.Elf.4sYBk84u2u5n9Hb/AoiJm4V6IQDxQYZKVN.cO8ixG"
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
  hash: "$2a$12$z/cDnBd54GBf0e8pJ53osOfWqc/dnr.P5vU.2BQuNh8VBHAfUoKvm"
  reserved: false
  backend_roles:
  - "logstash"
  description: "Demo logstash user"
readall:
  hash: "$2a$12$ut60xT.f2SkdJsDV70C2cu6C99xe3d5ASYwTEHlHA6HU7fbhWSWDq"
  reserved: false
  backend_roles:
  - "readall"
  description: "Demo readall user"
snapshotrestore:
  hash: "$2a$12$WDewkmehCJR8D9MlJziCb.xFmIti7jmtwh/7.qJcwh9s0Fn3JefUC"
  reserved: false
  backend_roles:
  - "snapshotrestore"
  description: "Demo snapshotrestore user"
`,
              }
            }
          },
          terminationGracePeriod: "60"
        }
      },
      {
        namespace: "opensearch",
        name: "node",
        version: "2.6.2",
        chart: "opensearch",
        repository: "https://opensearch-project.github.io/helm-charts",
        values: {
          clusterName: "opensearch",
          nodeGroup: "data",
          masterService: "opensearch-master",
          roles: ["data"],
          replicas: 2,
          config: {
            "opensearch.yml": `
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
        enabled_protocols:
          [
            "TLSv1.2"
          ]
        enabled_ciphers:
          [
            "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
            "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256",
            "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
            "TLS_RSA_WITH_AES_128_CBC_SHA256",
            "TLS_RSA_WITH_AES_128_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384",
            "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384",
            "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA",
            "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
            "TLS_RSA_WITH_AES_256_CBC_SHA256",
            "TLS_RSA_WITH_AES_256_CBC_SHA",
          ]
      http:
        enabled: false
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
      indices:
        [
          ".opendistro-alerting-config",
          ".opendistro-alerting-alert*",
          ".opendistro-anomaly-results*",
          ".opendistro-anomaly-detector*",
          ".opendistro-anomaly-checkpoints",
          ".opendistro-anomaly-detection-state",
          ".opendistro-reports-*",
          ".opendistro-notifications-*",
          ".opendistro-notebooks",
          ".opendistro-asynchronous-search-response*"
        ]
`
          },
          labels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
          opensearchJavaOpts: "-server -Xmx6144M -Xms6144M",
          resources: {
            limits: { cpu: "2000m", memory: "8192Mi" },
            requests: { cpu: "2000m", memory: "8192Mi" }
          },
          initResources: {
            limits: { cpu: "25m", memory: "128Mi" },
            requests: { cpu: "25m", memory: "128Mi" }
          },
          persistence: { enabled: true, storageClass: "longhorn", size: "30Gi", },
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
          terminationGracePeriod: "60"
        }
      },
      {
        namespace: "opensearch",
        name: "dashboards",
        version: "2.5.3",
        chart: "opensearch-dashboards",
        repository: "https://opensearch-project.github.io/helm-charts",
        values: {
          opensearchHosts: "http://opensearch-master:9200",
          replicaCount: 1,
          fullnameOverride: "opensearch-dashboards",
          config: {
            "opensearch_dashboards.yml": `
---
logging.quiet: true
opensearch.hosts: [http://opensearch-master:9200]
opensearch.ssl.verificationMode: none
opensearch.username: kibanaserver
opensearch.password: ${config.require("kibanaserverPassword")}
opensearch.requestHeadersWhitelist: [authorization, securitytenant] 
opensearch_security.multitenancy.enabled: true
opensearch_security.multitenancy.tenants.preferred: [Private, Global]
opensearch_security.readonly_mode.roles: [kibana_read_only]
opensearch_security.cookie.secure: false
server.host: '0.0.0.0'
server.rewriteBasePath: true
server.basePath: "/opensearch"
`,
          },
          labels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
          ingress: {
            enabled: true,
            ingressClassName: "nginx",
            hosts: [
              {
                host: "souther.example.com",
                paths: [
                  {
                    path: "/opensearch",
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
        version: "4.15.0",
        chart: "prometheus-elasticsearch-exporter",
        repository: "https://prometheus-community.github.io/helm-charts",
        values: {
          fullnameOverride: "opensearch-exporter",
          log: { level: "wran" },
          resources: {
            limits: { cpu: "100m", memory: "128Mi" },
            requests: { cpu: "100m", memory: "128Mi" }
          },
          podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "souther", datacenter: "dc01", domain: "local" },
          es: {
            uri: "http://admin:" + config.require("adminPassword") + "@opensearch-master:9200",
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