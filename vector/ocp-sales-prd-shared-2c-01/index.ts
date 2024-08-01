import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const podlabels = {
    customer: "sales",
    environment: "prd",
    project: "SEIM",
    group: "Vector",
    datacenter: "cn-north",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "datadog",
                annotations: {
                    //"openshift.io/scc": "privileged"
                },
                labels: {
                    //"security.openshift.io/scc.podSecurityLabelSync": "true",
                   // "pod-security.kubernetes.io/enforce": "privileged",
                   // "pod-security.kubernetes.io/audit": "privileged",
                   // "pod-security.kubernetes.io/warn": "privileged"
                }
            },
            spec: {}
        },
        release: [
            {
                namespace: "datadog",
                name: "kube-pod",
                chart: "vector",
                repositoryOpts: {
                    repo: "https://helm.vector.dev"
                },
                version: "0.33.0",
                values: {
                    role: "Agent",
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/vector",
                        tag: "0.38.0-distroless-libc"
                    },
                    podLabels: podlabels,
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    service: { enabled: false },
                    customConfig: {
//                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: {
                            kubernetes_logs: {
                                type: "kubernetes_logs",
                                max_line_bytes: 65536
                            }
                        },
                        transforms: {
                            kubernetes_remap: {
                                type: "remap",
                                inputs: ["kubernetes_logs"],
                                source: `kubernetes = del(.kubernetes)
file = del(.file)
message = del(.message)
kubernetes_labels = encode_json(kubernetes.pod_labels)
kubernetes_labels = replace(kubernetes_labels, "app.kubernetes.io", "app_kubernetes_io")
kubernetes_labels = replace(kubernetes_labels, "helm.sh", "helm_sh")
. = parse_json!(kubernetes_labels)
.message = message
.ip = kubernetes.pod_ip
.container = kubernetes.container_name
.node = kubernetes.pod_node_name
.pod = kubernetes.pod_name
.namespace = kubernetes.pod_namespace
.timestamp = timestamp(.timestamp) ?? now()
.cluster = "ocp-sales-prd-shared-2c-01"`
                            },
                            kubernetes_filter: {
                                type: "filter",
                                inputs: ["kubernetes_remap"],
                                condition: ''
                            }
                        },
                        sinks: {
                            kubernetes_logs_elasticsearch: {
                                type: "elasticsearch",
                                inputs: ["kubernetes_filter"],
                                bulk: { action: "index", index: "kube-pod-{{`{{ namespace }}`}}-%Y-%m-%d" },
                                endpoint: "https://192.168.0.102:9200",
                                mode: "bulk",
                                suppress_type_name: true,
                                acknowledgements: { enabled: false },
                                compression: "none",
                                encoding: null,
                                healthcheck: null,
                                tls: { verify_certificate: false, verify_hostname: false },
                                auth: { user: "admin", password: "password", strategy: "basic" },
                                buffer: { type: "memory", max_events: 81920, when_full: "block" },
                                batch: { max_events: 2048, timeout_secs: 20 }
                            }
                        }
                    },
                    securityContext: {
                        allowPrivilegeEscalation: false,
                        allowPrivilegedContainer: false,
                        "capabilities": {
                            "add": [
                                "CHOWN"
                            ],
                            "drop": [
                                "KILL",
                                "DAC_OVERRIDE",
                                "FOWNER",
                                "NET_BIND_SERVICE",
                                "FSETID",
                                "SETGID",
                                "SETUID",
                                "SETPCAP"
                            ]
                        },
                        "privileged": false,
                        "seLinuxOptions": {
                            "type": "container_logwriter_t"
                        },
                        "seccompProfile": {
                            "type": "RuntimeDefault"
                        }
                    },
                    podMonitor: {
                        enabled: true,
                    }
                }
            }

        ],
        customresource: [
            {
                apiVersion: "machineconfiguration.openshift.io/v1",
                kind: "MachineConfig",
                "metadata": {
                    "name": "50-selinux-file-contexts-local",
                    "labels": {
                        "machineconfiguration.openshift.io/role": "worker"
                    }
                },
                spec: {
                    config: {
                        "storage": {
                            "files": [
                                {
                                    "path": "/etc/selinux/targeted/contexts/files/file_contexts.local",
                                    "mode": 420,
                                    "overwrite": true,
                                    "contents": {
                                        "inline": "/var/lib/vector(/.*)?    system_u:object_r:container_file_t:s0\n"
                                    }
                                }
                            ]
                        },
                        "systemd": {
                            "units": [
                                {
                                    "contents": "[Unit]\nDescription=Set local SELinux file context for vector\n\n[Service]\nExecStart=/bin/bash -c '/usr/bin/mkdir -p /var/lib/vector;restorecon -Rv /var/lib/vector'\nRemainAfterExit=yes\nType=oneshot\n\n[Install]\nWantedBy=multi-user.target",
                                    "enabled": true,
                                    "name": "set-SELinux-context-local.service"
                                }
                            ]
                        }
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [release] });