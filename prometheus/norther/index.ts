import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "monitoring",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "configuration-secret",
                    namespace: "monitoring",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "objstore.yml": config.require("OBJSTORE.YML"),
                    "additionalscrape.job": config.require("ADDITIONALSCRAPE.JOB")
                },
                stringData: {}
            }
        ],
        kubepromstack: {
            namespace: "monitoring",
            name: "kube-prometheus-stack",
            chart: "kube-prometheus-stack",
            repository: "https://prometheus-community.github.io/helm-charts",
            version: "45.23.0",
            values: {
                fullnameOverride: "kubepromstack",
                defaultRules: { create: false },
                alertmanager: {
                    enabled: true,
                    config: {
                        global: {
                            http_config: {
                                tls_config: {
                                    insecure_skip_verify: true
                                }
                            },
                            resolve_timeout: "5m",
                            smtp_smarthost: "127.0.0.1:25",
                            smtp_from: "do-not-reply@example.com",
                            smtp_require_tls: false,
                            smtp_auth_username: "do-not-reply@example.com",
                            smtp_auth_password: "password"
                        },
                        route: {
                            group_by: ["alertname", "cluster", "service"],
                            group_wait: "45s",
                            group_interval: "5m",
                            repeat_interval: "24h",
                            receiver: "null",
                            routes: [
                                {
                                    receiver: "grafana-oncall",
                                    continue: true
                                },
                                //{
                                //    receiver: 'email',
                                //    continue: true
                                //},
                                {
                                    matchers: ["alertname = Watchdog"],
                                    receiver: 'null',
                                    continue: false
                                },
                            ]
                        },
                        inhibit_rules: [
                            {
                                source_matchers: ["severity = p1"],
                                target_matchers: ["severity =~ p2|p3|p4"],
                                equal: ['alertname', 'cluster', 'service']
                            }
                        ],
                        receivers: [
                            {
                                name: "null"
                            },
                            {
                                name: "email",
                                email_configs: [
                                    {
                                        send_resolved: true,
                                        headers: {
                                            subject: "[ {{ .Status | toUpper }} - {{ .CommonLabels.severity | toUpper }} ] Alertmanager notify for {{ .CommonLabels.alertname }}"
                                        },
                                        to: "somebody@example.com"
                                    }
                                ]
                            },
                            {
                                name: "grafana-oncall",
                                webhook_configs: [
                                    {
                                        url: "http://oncall-engine.oncall.svc.cluster.local:8080/integrations/v1/alertmanager/7KWjhXnudziro5RvuTL8WMJcZ/",
                                        send_resolved: true
                                    }
                                ]
                            }
                        ],
                        templates: ["/etc/alertmanager/config/*.tmpl"]
                    },
                    templateFiles: {
                        "default.tmpl": `
{{ define "__description" }}{{ end }}      
{{ define "__text_alert_firing_list" }}{{ range . }}
Start: {{ .StartsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}
{{ range .Labels.SortedPairs }}{{ .Name | title }}: {{ .Value }}
{{ end }}{{ range .Annotations.SortedPairs }}{{ .Name | title }}: {{ .Value }}{{ end }}
{{ end }}{{ end }}      
{{ define "__text_alert_resolved_list" }}{{ range . }}
Start: {{ .StartsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}
End:   {{ .EndsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}
Duration: {{ (.EndsAt.Sub .StartsAt).Truncate 1000000000 }}
{{ range .Labels.SortedPairs }}{{ .Name | title }}: {{ .Value }}
{{ end }}{{ range .Annotations.SortedPairs }}{{ .Name | title }}: {{ .Value }}{{ end }}
{{ end }}{{ end }}      
{{ define "wechat.default.message" }}{{ if gt (len .Alerts.Firing) 0 -}}
WARNING ☢
{{ template "__text_alert_firing_list" .Alerts.Firing }}
{{- end }}{{ if gt (len .Alerts.Resolved) 0 -}}
RESOLVED ❀
{{ template "__text_alert_resolved_list" .Alerts.Resolved }}
{{- end }}
{{- end }}
{{ define "wechat.default.api_secret" }}{{ end }}
{{ define "wechat.default.to_user" }}{{ end }}
{{ define "wechat.default.to_party" }}{{ end }}
{{ define "wechat.default.to_tag" }}{{ end }}
{{ define "wechat.default.agent_id" }}{{ end }}    


{{ define "email.default.html" }}
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!--
Style and HTML derived from https://github.com/mailgun/transactional-email-templates

The MIT License (MIT)

Copyright (c) 2014 Mailgun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
-->
<html xmlns="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
<head style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
<meta name="viewport" content="width=device-width" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />

</head>

<body itemscope="" itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; height: 100%; line-height: 1.6em; width: 100% !important; background-color: #f6f6f6; margin: 0; padding: 0;" bgcolor="#f6f6f6">

<table style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
  <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
    <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
    <td width="600" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; width: 100% !important; margin: 0 auto; padding: 0;" valign="top">
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
          <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 10px;" valign="top">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                  </td>
                </tr>
                {{ if gt (len .Alerts.Firing) 0 }}
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    <strong style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; color: #ff0000; margin: 0;">[{{ .Alerts.Firing | len }}] WARNING ☢</strong>
 
                  </td>
                </tr>
                {{ end }}
                {{ range .Alerts.Firing }}
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    Start: {{ .StartsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    {{ range .Labels.SortedPairs }}{{ .Name | title }}: {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                    {{ range .Annotations.SortedPairs }}{{ .Name | title }}: {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                  </td>
                </tr>
                {{ end }}

                {{ if gt (len .Alerts.Resolved) 0 }}
                  {{ if gt (len .Alerts.Firing) 0 }}
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    <br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    <hr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    <br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                  </td>
                </tr>
                  {{ end }}
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    <strong style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; color: #44945e; margin: 0;">[{{ .Alerts.Resolved | len }}] RESOLVED ❀</strong>
 
                  </td>
                </tr>
                {{ end }}
                {{ range .Alerts.Resolved }}
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    Start: {{ .StartsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    End: &nbsp;{{ .EndsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    Duration: {{ (.EndsAt.Sub .StartsAt).Truncate 1000000000 }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    {{ range .Labels.SortedPairs }}{{ .Name | title }}: {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                    {{ range .Annotations.SortedPairs }}{{ .Name | title }}: {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                  </td>
                </tr>
                {{ end }}
              </table>
            </td>
          </tr>
        </table>

        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
          <table width="100%" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            </tr>
          </table>
        </div></div>
    </td>
    <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
  </tr>
</table>

</body>
</html>

{{ end }}
`
                    },
                    ingress: {
                        enabled: true,
                        ingressClassName: "nginx",
                        annotations: {
                            "nginx.ingress.kubernetes.io/rewrite-target": "/$2",
                            "nginx.ingress.kubernetes.io/backend-protocol": "HTTP"
                        },
                        hosts: ["norther.example.com"],
                        paths: ["/alertmanager(/|$)(.*)"]
                    },
                    serviceMonitor: {
                        relabelings: [
                            { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                            { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                            { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                            { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                            { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                            { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                        ]
                    },
                    alertmanagerSpec: {
                        logLevel: "warn",
                        replicas: 1,
                        storage: {
                            volumeClaimTemplate: {
                                spec: {
                                    storageClassName: "longhorn",
                                    resources: {
                                        requests: {
                                            storage: "2Gi"
                                        }
                                    }
                                }
                            }
                        },
                        externalUrl: "https://norther.example.com/alertmanager/",
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        volumes: [
                            {
                                name: "cst-timezone",
                                hostPath: {
                                    path: "/usr/share/zoneinfo/PRC",
                                    type: "File"
                                }
                            }
                        ],
                        volumeMounts: [{
                            name: "cst-timezone",
                            mountPath: "/etc/localtime",
                            readOnly: true
                        }]
                    }
                },
                grafana: { enabled: false },
                kubeApiServer: {
                    enabled: true,
                    serviceMonitor: {
                        relabelings: [
                            { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                            { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                            { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                            { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                            { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                            { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                        ]
                    }
                },
                kubelet: {
                    enabled: true,
                    serviceMonitor: {
                        probes: false,
                        cAdvisorRelabelings: [
                            { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                            { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                            { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                            { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                            { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                            { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                            { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                        ],
                        relabelings: [
                            { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                            { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                            { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                            { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                            { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                            { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                            { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                        ]
                    }
                },
                kubeControllerManager: {
                    enabled: true,
                    serviceMonitor: {
                        relabelings: [
                            { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                            { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                            { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                            { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                            { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                            { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                            { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                        ]
                    }
                },
                coreDns: {
                    enabled: true,
                    serviceMonitor: {
                        relabelings: [
                            { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                            { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                            { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                            { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                            { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                            { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                            { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                        ]
                    }
                },
                kubeEtcd: {
                    enabled: true,
                    service: {
                        port: "2381",
                        targetPort: "2381"
                    },
                    serviceMonitor: {
                        scheme: "http",
                        relabelings: [
                            { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                            { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                            { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                            { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                            { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                            { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                            { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                        ]
                    }
                },
                kubeScheduler: {
                    enabled: true,
                    service: {
                        port: "10259",
                        targetPort: "10259"
                    },
                    serviceMonitor: {
                        https: true,
                        insecureSkipVerify: true,
                        relabelings: [
                            { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                            { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                            { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                            { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                            { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                            { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                            { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                        ]
                    }
                },
                kubeProxy: {
                    enabled: true,
                    serviceMonitor: {
                        relabelings: [
                            { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                            { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                            { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                            { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                            { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                            { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                            { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                        ]
                    }
                },
                kubeStateMetrics: { enabled: true },
                "kube-state-metrics": {
                    fullnameOverride: "kube-state-metrics",
                    image: {
                        registry: "registry.cn-hangzhou.aliyuncs.com",
                        repository: "goldstrike/kube-state-metrics",
                        tag: "v2.8.2"
                    },
                    customLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    metricLabelsAllowlist: ["nodes=[*]"],
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    prometheus: {
                        monitor: {
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
                    }
                },
                nodeExporter: { enabled: true },
                "prometheus-node-exporter": {
                    fullnameOverride: "node-exporter",
                    resources: {
                        limits: { cpu: "50m", memory: "32Mi" },
                        requests: { cpu: "50m", memory: "32Mi" }
                    },
                    extraArgs: [
                        "--collector.filesystem.mount-points-exclude=^/(dev|proc|sys|var/lib/docker/.+|var/lib/kubelet/.+)($|/)",
                        "--collector.filesystem.fs-types-exclude=^(autofs|binfmt_misc|bpf|cgroup2?|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|iso9660|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tracefs)$",
                        "--collector.cpu.info"
                    ],
                    podLabels: { jobLabel: "node-exporter", customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    prometheus: {
                        monitor: {
                            enabled: true,
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_node_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ],
                        }
                    }
                },
                prometheusOperator: {
                    enabled: true,
                    admissionWebhooks: {
                        enabled: true,
                        patch: {
                            enabled: true,
                            image: {
                                registry: "registry.cn-hangzhou.aliyuncs.com",
                                repository: "google_containers/kube-webhook-certgen",
                                tag: "v20221220-controller-v1.5.1-58-g787ea74b6"
                            }
                        }
                    },
                    podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                    logLevel: "warn",
                    serviceMonitor: {
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                        ]
                    },
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    prometheusConfigReloader: {
                        resources: {
                            limits: { cpu: "200m", memory: "64Mi" },
                            requests: { cpu: "200m", memory: "64Mi" }
                        }
                    }
                },
                prometheus: {
                    enabled: true,
                    thanosService: {
                        enabled: true,
                    },
                    thanosServiceMonitor: {
                        enabled: true,
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                            { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                            { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                            { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                            { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                            { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                            { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                        ]
                    },
                    ingress: {
                        enabled: true,
                        ingressClassName: "nginx",
                        annotations: { "nginx.ingress.kubernetes.io/backend-protocol": "HTTP" },
                        hosts: ["norther.example.com"],
                        paths: ["/prometheus"],
                    },
                    serviceMonitor: {
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                            { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "demo" },
                            { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "dev" },
                            { sourceLabels: ["__address__"], targetLabel: "project", replacement: "cluster" },
                            { sourceLabels: ["__address__"], targetLabel: "group", replacement: "norther" },
                            { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "dc01" },
                            { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                        ]
                    },
                    prometheusSpec: {
                        disableCompaction: true,
                        scrapeInterval: "60s",
                        scrapeTimeout: "30s",
                        evaluationInterval: "60s",
                        externalLabels: { cluster: "norther" },
                        externalUrl: "https://norther.example.com/prometheus/",
                        ruleSelectorNilUsesHelmValues: false,
                        serviceMonitorSelectorNilUsesHelmValues: false,
                        podMonitorSelectorNilUsesHelmValues: false,
                        retention: "6h",
                        retentionSize: "4096MB",
                        replicas: 1,
                        logLevel: "warn",
                        routePrefix: "/prometheus",
                        resources: {
                            limits: { cpu: "1000m", memory: "3072Mi" },
                            requests: { cpu: "1000m", memory: "3072Mi" }
                        },
                        storageSpec: {
                            volumeClaimTemplate: {
                                spec: {
                                    storageClassName: "longhorn",
                                    resources: {
                                        requests: {
                                            storage: "8Gi"
                                        }
                                    }
                                }
                            }
                        },
                        additionalScrapeConfigsSecret: {
                            enabled: true,
                            name: "configuration-secret",
                            key: "additionalscrape.job"
                        },
                        thanos: {
                            objectStorageConfig: {
                                name: "configuration-secret",
                                key: "objstore.yml"
                            }
                        }
                    }
                }
            }
        },
        helm: [
            {
                namespace: "monitoring",
                name: "thanos",
                chart: "thanos",
                repository: "https://charts.bitnami.com/bitnami",
                version: "12.4.3",
                values: {
                    existingObjstoreSecret: "configuration-secret",
                    query: {
                        enabled: true,
                        logLevel: "warn",
                        replicaLabel: ["prometheus_replica", "cluster"],
                        dnsDiscovery: {
                            enabled: true,
                            sidecarsService: "kubepromstack-thanos-discovery",
                            sidecarsNamespace: "monitoring"
                        },
                        stores: ["192.168.0.110:10901", "192.168.0.110:10903"],
                        extraFlags: ["--web.external-prefix=thanos-query", "--web.route-prefix=thanos-query", "--query.partial-response"],
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "128Mi" },
                            requests: { cpu: "200m", memory: "128Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        ingress: {
                            enabled: true,
                            hostname: "norther.example.com",
                            ingressClassName: "nginx",
                            annotations: { "nginx.ingress.kubernetes.io/backend-protocol": "HTTP" },
                            path: "/thanos-query"
                        }
                    },
                    queryFrontend: {
                        enabled: true,
                        logLevel: "warn",
                        args: [
                            "query-frontend",
                            "--log.level=warn",
                            "--log.format=logfmt",
                            "--http-address=0.0.0.0:10902",
                            "--query-frontend.downstream-url=http://thanos-query:9090/thanos-query",
                            "--labels.split-interval=1h",
                            "--labels.max-retries-per-request=10",
                            "--query-range.split-interval=1h",
                            "--query-range.max-retries-per-request=10",
                            "--query-range.max-query-parallelism=32",
                            "--query-range.partial-response", `--query-range.response-cache-config=
type: REDIS
config:
  addr: "redis-master:6379"
  db: 3
  dial_timeout: 10s
  read_timeout: 10s
  write_timeout: 10s
  pool_size: 200
  min_idle_conns: 20
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
  cache_size: 64MiB
  expiration: 24h0m0s
`, `--labels.response-cache-config=
type: REDIS
config:
  addr: "redis-master:6379"
  db: 2
  dial_timeout: 10s
  read_timeout: 10s
  write_timeout: 10s
  pool_size: 200
  min_idle_conns: 20
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
  cache_size: 64MiB
  expiration: 24h0m0s
`
                        ],
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "128Mi" },
                            requests: { cpu: "200m", memory: "128Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" }
                    },
                    bucketweb: {
                        enabled: true,
                        logLevel: "warn",
                        extraFlags: ["--web.external-prefix=thanos-bucketweb", "--web.route-prefix=thanos-bucketweb"],
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        ingress: {
                            enabled: true,
                            hostname: "norther.example.com",
                            ingressClassName: "nginx",
                            annotations: { "nginx.ingress.kubernetes.io/backend-protocol": "HTTP" },
                            path: "/thanos-bucketweb"
                        }
                    },
                    compactor: {
                        enabled: true,
                        logLevel: "warn",
                        // 5m resolution retention must be higher than the minimum block size after which 1h resolution downsampling will occur (10 days).
                        retentionResolutionRaw: "10d",
                        retentionResolution5m: "10d",
                        retentionResolution1h: "10d",
                        extraFlags: [
                            "--compact.cleanup-interval=6h",
                            "--compact.concurrency=2"
                        ],
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "monitoring", group: "thanos", datacenter: "dc01", domain: "local" },
                        persistence: {
                            enabled: true,
                            storageClass: "longhorn",
                            size: "8Gi"
                        }
                    },
                    storegateway: {
                        enabled: true,
                        logLevel: "warn",
                        extraFlags: [
                            "--store.grpc.series-max-concurrency=32",
                            "--block-sync-concurrency=32",
                            "--store.grpc.series-sample-limit=50000", `--index-cache.config=
type: REDIS
config:
  addr: "redis-master:6379"
  db: 1
  dial_timeout: 10s
  read_timeout: 10s
  write_timeout: 10s
  pool_size: 200
  min_idle_conns: 20
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
  cache_size: 128MiB
  expiration: 24h0m0s
`, `--store.caching-bucket.config=
type: REDIS
config:
  addr: "redis-master:6379"
  db: 0
  dial_timeout: 10s
  read_timeout: 10s
  write_timeout: 10s
  pool_size: 200
  min_idle_conns: 20
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
  cache_size: 64MiB
  expiration: 24h0m0s
`
                        ],
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        persistence: {
                            enabled: true,
                            storageClass: "longhorn",
                            size: "8Gi"
                        }
                    },
                    metrics: {
                        enabled: true,
                        serviceMonitor: {
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
                        },
                        prometheusRule: {
                            enabled: false,
                            groups: []
                        }
                    },
                    volumePermissions: { enabled: false }
                }
            },
            {
                namespace: "monitoring",
                name: "redis",
                chart: "redis",
                repository: "https://charts.bitnami.com/bitnami",
                version: "17.10.1",
                values: {
                    architecture: "standalone",
                    auth: { enabled: false, sentinel: false },
                    commonConfiguration: `appendonly no
maxmemory 512mb
tcp-keepalive 60
tcp-backlog 8192
maxclients 1000
bind 0.0.0.0
databases 4
save ""`,
                    master: {
                        resources: {
                            limits: { cpu: "300m", memory: "576Mi" },
                            requests: { cpu: "300m", memory: "576Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "monitoring", group: "thanos", datacenter: "dc01", domain: "local" },
                        podSecurityContext: { sysctls: [{ name: "net.core.somaxconn", value: "8192" }] },
                        persistence: { enabled: false }
                    },
                    metrics: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "monitoring", group: "thanos", datacenter: "dc01", domain: "local" },
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
                            relabellings: [
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
                    sysctl: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        }
                    }
                }
            },
            {
                namespace: "monitoring",
                name: "prometheus-blackbox-exporter",
                chart: "prometheus-blackbox-exporter",
                repository: "https://prometheus-community.github.io/helm-charts",
                version: "7.7.0",
                values: {
                    fullnameOverride: "blackbox-exporter",
                    config: {
                        modules: {
                            http_2xx: {
                                prober: "http",
                                timeout: "5s",
                                http: {
                                    valid_http_versions: ["HTTP/1.1", "HTTP/2.0"],
                                    valid_status_codes: [],
                                    method: "GET",
                                    headers: {
                                        "Accept-Language": "en-US"
                                    },
                                    no_follow_redirects: false,
                                    fail_if_ssl: false,
                                    fail_if_not_ssl: false,
                                    tls_config: { insecure_skip_verify: true },
                                    preferred_ip_protocol: "ip4",
                                    ip_protocol_fallback: false
                                }
                            },
                            http_post_2xx: {
                                prober: "http",
                                timeout: "5s",
                                http: {
                                    valid_http_versions: ["HTTP/1.1", "HTTP/2.0"],
                                    valid_status_codes: [],
                                    method: "POST",
                                    headers: {
                                        "Accept-Language": "en-US",
                                        "Content-Type": "application/json"
                                    },
                                    body: "{}",
                                    no_follow_redirects: false,
                                    fail_if_ssl: false,
                                    fail_if_not_ssl: false,
                                    tls_config: { insecure_skip_verify: true },
                                    preferred_ip_protocol: "ip4",
                                    ip_protocol_fallback: false
                                }
                            }
                        }
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "64Mi" },
                        requests: { cpu: "100m", memory: "64Mi" }
                    },
                    pod: {
                        labels: { customer: "demo", environment: "dev", project: "monitoring", group: "blackbox", datacenter: "dc01", domain: "local" },
                    },
                    replicas: 1,
                    serviceMonitor: {
                        selfMonitor: {
                            enabled: true,
                            additionalRelabeling: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ],
                            interval: "60s",
                            scrapeTimeout: "30s"
                        }
                    },
                    prometheusRule: { enabled: false }
                }
            }
        ],
        rules: [
            { name: "../_rules/priority/kube-prometheus-stack-alertmanager" },
            { name: "../_rules/priority/kube-prometheus-stack-config-reloaders" },
            { name: "../_rules/priority/kube-prometheus-stack-etcd" },
            { name: "../_rules/priority/kube-prometheus-stack-general" },
            { name: "../_rules/priority/kube-prometheus-stack-k8s" },
            { name: "../_rules/priority/kube-prometheus-stack-kube-apiserver-availability" },
            { name: "../_rules/priority/kube-prometheus-stack-kube-apiserver-burnrate" },
            { name: "../_rules/priority/kube-prometheus-stack-kube-apiserver-histogram" },
            { name: "../_rules/priority/kube-prometheus-stack-kube-apiserver-slos" },
            { name: "../_rules/priority/kube-prometheus-stack-kube-prometheus-general" },
            { name: "../_rules/priority/kube-prometheus-stack-kube-prometheus-node-recording" },
            { name: "../_rules/priority/kube-prometheus-stack-kube-scheduler" },
            { name: "../_rules/priority/kube-prometheus-stack-kube-state-metrics" },
            { name: "../_rules/priority/kube-prometheus-stack-kubelet" },
            { name: "../_rules/priority/kube-prometheus-stack-kubernetes-apps" },
            { name: "../_rules/priority/kube-prometheus-stack-kubernetes-resources" },
            { name: "../_rules/priority/kube-prometheus-stack-kubernetes-storage" },
            { name: "../_rules/priority/kube-prometheus-stack-kubernetes-system" },
            { name: "../_rules/priority/kube-prometheus-stack-kubernetes-system-apiserver" },
            { name: "../_rules/priority/kube-prometheus-stack-kubernetes-system-controller-manager" },
            { name: "../_rules/priority/kube-prometheus-stack-kubernetes-system-kube-proxy" },
            { name: "../_rules/priority/kube-prometheus-stack-kubernetes-system-kubelet" },
            { name: "../_rules/priority/kube-prometheus-stack-kubernetes-system-scheduler" },
            { name: "../_rules/priority/kube-prometheus-stack-node-exporter" },
            { name: "../_rules/priority/kube-prometheus-stack-node" },
            { name: "../_rules/priority/kube-prometheus-stack-prometheus" },
            { name: "../_rules/priority/kube-prometheus-stack-prometheus-operator" },
            { name: "../_rules/priority/blackbox" },
            { name: "../_rules/priority/jenkins" }
        ]
    }
]

for (var i in deploy_spec) {
    // Create Kubernetes Namespace.
    const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
        metadata: deploy_spec[i].namespace.metadata,
        spec: deploy_spec[i].namespace.spec
    });
    // Create Kubernetes Secret.
    for (var secret_index in deploy_spec[i].secret) {
        const secret = new k8s.core.v1.Secret(deploy_spec[i].secret[secret_index].metadata.name, {
            metadata: deploy_spec[i].secret[secret_index].metadata,
            type: deploy_spec[i].secret[secret_index].type,
            data: deploy_spec[i].secret[secret_index].data,
            stringData: deploy_spec[i].secret[secret_index].stringData
        }, { dependsOn: [namespace] });
    }
    // Create kube-prometheus-stack Release Resource.
    const kubepromstack = new k8s.helm.v3.Release(deploy_spec[i].kubepromstack.name, {
        namespace: deploy_spec[i].kubepromstack.namespace,
        name: deploy_spec[i].kubepromstack.name,
        chart: deploy_spec[i].kubepromstack.chart,
        version: deploy_spec[i].kubepromstack.version,
        values: deploy_spec[i].kubepromstack.values,
        skipAwait: false,
        repositoryOpts: {
            repo: deploy_spec[i].kubepromstack.repository,
        },
    }, { dependsOn: [namespace] });
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
        }, { dependsOn: [kubepromstack] });
    }
    // Create Prometheus rules.
    for (var rule_index in deploy_spec[i].rules) {
        const guestbook = new k8s.yaml.ConfigFile(deploy_spec[i].rules[rule_index].name, {
            file: deploy_spec[i].rules[rule_index].name,
            skipAwait: true,
        }, { dependsOn: [kubepromstack] });
    }
}