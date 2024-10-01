import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "owncloud",
                    annotations: {},
                    labels: {}
                },
                spec: {}
            }
        ],
        release: [
            {
                namespace: "owncloud",
                name: "mariadb",
                chart: "mariadb",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "19.0.6",
                values: {
                    global: {
                        imageRegistry: "swr.cn-east-3.myhuaweicloud.com",
                        storageClass: "local-path"
                    },
                    image: {
                        repository: "docker-io/mariadb",
                        tag: "10.5.26-debian-12-r2"
                    },
                    auth: {
                        rootPassword: "password",
                        database: "owncloud",
                        username: "owncloud",
                        password: "password",
                    },
                    primary: {
                        configuration: `
    [mysqld]
    skip-log-bin
    skip-name-resolve
    explicit_defaults_for_timestamp
    basedir=/opt/bitnami/mariadb
    plugin_dir=/opt/bitnami/mariadb/plugin
    port=3306
    socket=/opt/bitnami/mariadb/tmp/mysql.sock
    tmpdir=/opt/bitnami/mariadb/tmp
    max_allowed_packet=16M
    bind-address=0.0.0.0
    pid-file=/opt/bitnami/mariadb/tmp/mysqld.pid
    log-error=/opt/bitnami/mariadb/logs/mysqld.log
    character-set-server=UTF8
    collation-server=utf8_general_ci
    slow_query_log_file=/opt/bitnami/mariadb/logs/mysqld.log
    slow_query_log=0
    max_connections=100
    performance_schema_max_table_instances=256
    table_definition_cache=400
    table_open_cache=128
    innodb_buffer_pool_size=256M
    innodb_flush_log_at_trx_commit=2
    query_response_time_stats=1
    plugin_load_add=query_response_time
    
    [client]
    port=3306
    socket=/opt/bitnami/mariadb/tmp/mysql.sock
    default-character-set=UTF8
    plugin_dir=/opt/bitnami/mariadb/plugin
    
    [manager]
    port=3306
    socket=/opt/bitnami/mariadb/tmp/mysql.sock
    pid-file=/opt/bitnami/mariadb/tmp/mysqld.pid
    `,
                        extraEnvVars: [
                            { name: "MARIADB_COLLATE", value: "utf8mb4_general_ci" },
                            { name: "MARIADB_CHARACTER_SET", value: "utf8mb4" }
                        ],
                        persistence: { size: "7Gi" }
                    }
                }
            },
            {
                namespace: "owncloud",
                name: "owncloud",
                chart: "owncloud",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "12.2.11",
                values: {
                    global: {
                        imageRegistry: "swr.cn-east-3.myhuaweicloud.com",
                        storageClass: "local-path"
                    },
                    image: {
                        repository: "docker-io/owncloud-server",
                        tag: "10.11.0-debian-11-r6"
                    },
                    owncloudUsername: "admin",
                    owncloudPassword: "password",
                    mariadb: { "enabled": false },
                    externalDatabase: {
                        host: "mariadb",
                        port: 3306,
                        user: "owncloud",
                        password: "password",
                        database: "owncloud"
                    },
                    persistence: {
                        size: "255Gi"
                    },
                    service: {
                        type: "ClusterIP"
                    },
                    ingress: {
                        enabled: true,
                        hostname: "owncloud.home.local",
                        ingressClassName: "traefik"
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });