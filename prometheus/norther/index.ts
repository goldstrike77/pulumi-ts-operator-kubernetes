import * as k8s from "@pulumi/kubernetes";

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
                    "objstore.yml": "dHlwZTogczMKY29uZmlnOgogIGJ1Y2tldDogdGhhbm9zLW5vcnRoZXIKICBlbmRwb2ludDogZGVtby1wcmQtY2x1c3Rlci1zdG9yYWdlLW1pbmlvLW9zcy5zZXJ2aWNlLmRjMDEubG9jYWwKICBhY2Nlc3Nfa2V5OiBHQTgxQ0U2Uk1MQVpaOEVURVpDRwogIHNlY3JldF9rZXk6IEFRSFVjTU43enU2bzlxM01FQkZ5TUc5dWQ0OU5wMjRJM2VFS2M2cmEKICBpbnNlY3VyZTogZmFsc2UKICBodHRwX2NvbmZpZzoKICAgIGlkbGVfY29ubl90aW1lb3V0OiAybQogICAgcmVzcG9uc2VfaGVhZGVyX3RpbWVvdXQ6IDVtCiAgICBpbnNlY3VyZV9za2lwX3ZlcmlmeTogdHJ1ZQo=",
                    "alertmanager.tmpl": "e3sgZGVmaW5lICJfX3N1YmplY3QiIH19W3t7IC5TdGF0dXMgfCB0b1VwcGVyIH19e3sgaWYgZXEgLlN0YXR1cyAiZmlyaW5nIiB9fTp7eyAuQWxlcnRzLkZpcmluZyB8IGxlbiB9fXt7IGVuZCB9fV0ge3sgLkdyb3VwTGFiZWxzLlNvcnRlZFBhaXJzLlZhbHVlcyB8IGpvaW4gIiAiIH19IHt7IGlmIGd0IChsZW4gLkNvbW1vbkxhYmVscykgKGxlbiAuR3JvdXBMYWJlbHMpIH19KHt7IHdpdGggLkNvbW1vbkxhYmVscy5SZW1vdmUgLkdyb3VwTGFiZWxzLk5hbWVzIH19e3sgLlZhbHVlcyB8IGpvaW4gIiAiIH19e3sgZW5kIH19KXt7IGVuZCB9fXt7IGVuZCB9fQp7eyBkZWZpbmUgIl9fZGVzY3JpcHRpb24iIH19e3sgZW5kIH19ICAgICAgCnt7IGRlZmluZSAiX190ZXh0X2FsZXJ0X2ZpcmluZ19saXN0IiB9fXt7IHJhbmdlIC4gfX0KU3RhcnQ6IHt7IC5TdGFydHNBdC5Mb2NhbC5Gb3JtYXQgIk1vbiwgMDIgSmFuIDIwMDYgMTU6MDQ6MDUgTVNUIiB9fQp7eyByYW5nZSAuTGFiZWxzLlNvcnRlZFBhaXJzIH19e3sgLk5hbWUgfCB0aXRsZSB9fToge3sgLlZhbHVlIH19Cnt7IGVuZCB9fXt7IHJhbmdlIC5Bbm5vdGF0aW9ucy5Tb3J0ZWRQYWlycyB9fXt7IC5OYW1lIHwgdGl0bGUgfX06IHt7IC5WYWx1ZSB9fXt7IGVuZCB9fQp7eyBlbmQgfX17eyBlbmQgfX0gICAgICAKe3sgZGVmaW5lICJfX3RleHRfYWxlcnRfcmVzb2x2ZWRfbGlzdCIgfX17eyByYW5nZSAuIH19ClN0YXJ0OiB7eyAuU3RhcnRzQXQuTG9jYWwuRm9ybWF0ICJNb24sIDAyIEphbiAyMDA2IDE1OjA0OjA1IE1TVCIgfX0KRW5kOiAgIHt7IC5FbmRzQXQuTG9jYWwuRm9ybWF0ICJNb24sIDAyIEphbiAyMDA2IDE1OjA0OjA1IE1TVCIgfX0KRHVyYXRpb246IHt7ICguRW5kc0F0LlN1YiAuU3RhcnRzQXQpLlRydW5jYXRlIDEwMDAwMDAwMDAgfX0Ke3sgcmFuZ2UgLkxhYmVscy5Tb3J0ZWRQYWlycyB9fXt7IC5OYW1lIHwgdGl0bGUgfX06IHt7IC5WYWx1ZSB9fQp7eyBlbmQgfX17eyByYW5nZSAuQW5ub3RhdGlvbnMuU29ydGVkUGFpcnMgfX17eyAuTmFtZSB8IHRpdGxlIH19OiB7eyAuVmFsdWUgfX17eyBlbmQgfX0Ke3sgZW5kIH19e3sgZW5kIH19ICAgICAgCnt7IGRlZmluZSAid2VjaGF0LmRlZmF1bHQubWVzc2FnZSIgfX17eyBpZiBndCAobGVuIC5BbGVydHMuRmlyaW5nKSAwIC19fQpXQVJOSU5HIOKYogp7eyB0ZW1wbGF0ZSAiX190ZXh0X2FsZXJ0X2ZpcmluZ19saXN0IiAuQWxlcnRzLkZpcmluZyB9fQp7ey0gZW5kIH19e3sgaWYgZ3QgKGxlbiAuQWxlcnRzLlJlc29sdmVkKSAwIC19fQpSRVNPTFZFRCDinYAKe3sgdGVtcGxhdGUgIl9fdGV4dF9hbGVydF9yZXNvbHZlZF9saXN0IiAuQWxlcnRzLlJlc29sdmVkIH19Cnt7LSBlbmQgfX0Ke3stIGVuZCB9fQp7eyBkZWZpbmUgIndlY2hhdC5kZWZhdWx0LmFwaV9zZWNyZXQiIH19e3sgZW5kIH19Cnt7IGRlZmluZSAid2VjaGF0LmRlZmF1bHQudG9fdXNlciIgfX17eyBlbmQgfX0Ke3sgZGVmaW5lICJ3ZWNoYXQuZGVmYXVsdC50b19wYXJ0eSIgfX17eyBlbmQgfX0Ke3sgZGVmaW5lICJ3ZWNoYXQuZGVmYXVsdC50b190YWciIH19e3sgZW5kIH19Cnt7IGRlZmluZSAid2VjaGF0LmRlZmF1bHQuYWdlbnRfaWQiIH19e3sgZW5kIH19ICAgIAo=",
                    "alertmanager.yaml": "Z2xvYmFsOgogIGh0dHBfY29uZmlnOgogICAgdGxzX2NvbmZpZzoKICAgICAgaW5zZWN1cmVfc2tpcF92ZXJpZnk6IHRydWUgICAgCiAgcmVzb2x2ZV90aW1lb3V0OiA1bQpyb3V0ZToKICBncm91cF9ieTogWydqb2InXQogIGdyb3VwX3dhaXQ6IDFtCiAgZ3JvdXBfaW50ZXJ2YWw6IDFtCiAgcmVwZWF0X2ludGVydmFsOiAyaAogIHJlY2VpdmVyOiAnd2VjaGF0JwogIHJvdXRlczoKICAtIG1hdGNoOgogICAgICBhbGVydG5hbWU6IFdhdGNoZG9nCiAgICBjb250aW51ZTogdHJ1ZQogICAgcmVjZWl2ZXI6ICdudWxsJwogIC0gbWF0Y2g6CiAgICByZWNlaXZlcjogJ3dlY2hhdCcKICAgIGNvbnRpbnVlOiB0cnVlCnJlY2VpdmVyczoKLSBuYW1lOiAnbnVsbCcKLSBuYW1lOiAnd2VjaGF0JwogIHdlY2hhdF9jb25maWdzOgogIC0gc2VuZF9yZXNvbHZlZDogdHJ1ZQogICAgdG9fcGFydHk6ICc1JwogICAgYWdlbnRfaWQ6ICcxMDAwMDA1JwogICAgY29ycF9pZDogJ3d4ZTc4NzYwNWYxZDE3MDBkYScKICAgIGFwaV9zZWNyZXQ6ICcwQmZqV1pod3FGaTBJVUhOOHNNaDBKRWQ4OTM4M2lpbjFUVGFKYWpKX1NJJwp0ZW1wbGF0ZXM6Ci0gJy9ldGMvYWxlcnRtYW5hZ2VyL2NvbmZpZy8qLnRtcGwnCg==",
                    "additionalscrape.job": "LSBqb2JfbmFtZTogJ3VuQXV0aGVudGljYXRlIGV4cG9ydGVycycNCiAgdGxzX2NvbmZpZzoNCiAgICBpbnNlY3VyZV9za2lwX3ZlcmlmeTogdHJ1ZQ0KICBjb25zdWxfc2RfY29uZmlnczoNCiAgICAtIHNlcnZlcjogJ2NvbnN1bC5zZXJ2aWNlLmRjMDEubG9jYWw6ODUwMCcNCiAgICAgIHRva2VuOiA3NDcxODI4Yy1kNTBhLTRiMjUtYjZhNS1kODBmMDJhMDNiYWUNCiAgICAgIHJlZnJlc2hfaW50ZXJ2YWw6IDYwcw0KICAgICAgc2VydmljZXM6IFsnYWxlcnRtYW5hZ2VyX2V4cG9ydGVyJywgJ2F6dXJlLW1ldHJpY3NfZXhwb3J0ZXInLCAnYXVkaXRiZWF0X2V4cG9ydGVyJywgJ2JsYWNrYm94X2V4cG9ydGVyJywgJ2NvbnN1bF9leHBvcnRlcicsICdkZWxsaHdfZXhwb3J0ZXInLCAnZG9ja2VyX2V4cG9ydGVyJywgJ2VsYXN0aWNzZWFyY2hfZXhwb3J0ZXInLCAnZmlsZWJlYXRfZXhwb3J0ZXInLCAnZ2l0bGFiX2V4cG9ydGVyJywgJ2dyYWZhbmFfZXhwb3J0ZXInLCAnaGFwcm94eV9leHBvcnRlcicsICdpbmdyZXNzLW5naW54X2V4cG9ydGVyJywgJ2plbmtpbnNfZXhwb3J0ZXInLCAnam14X2V4cG9ydGVyJywgJ2thZmthX2V4cG9ydGVyJywgJ2tlZXBhbGl2ZWRfZXhwb3J0ZXInLCAna2liYW5hX2V4cG9ydGVyJywgJ2t1YmUtc3RhdGUtbWV0cmljc19leHBvcnRlcicsICdsb2dzdGFzaF9leHBvcnRlcicsICdtaW5pb19leHBvcnRlcicsICdtb25nb2RiX2V4cG9ydGVyJywgJ215c3FsZF9leHBvcnRlcicsICduZXRkYXRhX2V4cG9ydGVyJywgJ25naW54X2V4cG9ydGVyJywgJ25vZGVfZXhwb3J0ZXInLCAnb3BlbmxkYXBfZXhwb3J0ZXInLCAnb3NzZWNfZXhwb3J0ZXInLCAncGFja2V0YmVhdF9leHBvcnRlcicsICdwaHAtZnBtX2V4cG9ydGVyJywgJ3Bvc3RncmVzX2V4cG9ydGVyJywgJ3B1c2hnYXRld2F5X2V4cG9ydGVyJywgJ3Byb21ldGhldXNfZXhwb3J0ZXInLCAncmFiYml0bXFfZXhwb3J0ZXInLCAncmVkaXMtc2VudGluZWxfZXhwb3J0ZXInLCAncmVkaXMtc2VydmVyX2V4cG9ydGVyJywgJ3NreXdhbGtpbmdfZXhwb3J0ZXInLCAnc21va2VwaW5nX2V4cG9ydGVyJywgJ3NubXBfZXhwb3J0ZXInLCAnc3RhdHNkX2V4cG9ydGVyJywgJ3RoYW5vcy1idWNrZXRfZXhwb3J0ZXInLCAndGhhbm9zLWNvbXBhY3RfZXhwb3J0ZXInLCAndGhhbm9zLXF1ZXJ5X2V4cG9ydGVyJywgJ3RoYW5vcy1xdWVyeS1mcm9udGVuZF9leHBvcnRlcicsICd0aGFub3Mtc2lkZWNhcl9leHBvcnRlcicsICd0aGFub3Mtc3RvcmVfZXhwb3J0ZXInLCAndmF1bHRfZXhwb3J0ZXInLCAndm13YXJlX2V4cG9ydGVyJywgJ3dtaV9leHBvcnRlcicsICd6b29rZWVwZXJfZXhwb3J0ZXInXQ0KICAgICAgc2NoZW1lOiBodHRwcw0KICAgICAgdGxzX2NvbmZpZzoNCiAgICAgICAgaW5zZWN1cmVfc2tpcF92ZXJpZnk6IHRydWUNCiAgcmVsYWJlbF9jb25maWdzOg0KICAgIC0gcmVnZXg6IGpvYg0KICAgICAgYWN0aW9uOiBsYWJlbGRyb3ANCiAgICAtIHNvdXJjZV9sYWJlbHM6IFtfX21ldGFfY29uc3VsX3NlcnZpY2VfYWRkcmVzc10NCiAgICAgIHRhcmdldF9sYWJlbDogJ2lwYWRkcmVzcycNCiAgICAtIHJlZ2V4OiBfX21ldGFfY29uc3VsX3NlcnZpY2VfbWV0YWRhdGFfKC4rKQ0KICAgICAgYWN0aW9uOiBsYWJlbG1hcA0KICAgIC0gc291cmNlX2xhYmVsczogW19fbWV0YV9jb25zdWxfc2VydmljZV0NCiAgICAgIHJlcGxhY2VtZW50OiAnJHsxfScNCiAgICAgIHRhcmdldF9sYWJlbDogJ3NlcnZpY2UnDQogICAgICByZWdleDogJyhbXj1dKylfZXhwb3J0ZXInDQogICAgLSBzb3VyY2VfbGFiZWxzOiBbX19tZXRhX2NvbnN1bF9zZXJ2aWNlX21ldGFkYXRhX21ldHJpY3NfcGF0aF0NCiAgICAgIGFjdGlvbjogcmVwbGFjZQ0KICAgICAgdGFyZ2V0X2xhYmVsOiBfX21ldHJpY3NfcGF0aF9fDQogICAgICByZWdleDogKC4rKQ0KICAgIC0gc291cmNlX2xhYmVsczogW19fbWV0YV9jb25zdWxfc2VydmljZV9tZXRhZGF0YV9zY2hlbWVdDQogICAgICBhY3Rpb246IHJlcGxhY2UNCiAgICAgIHRhcmdldF9sYWJlbDogX19zY2hlbWVfXw0KICAgICAgcmVnZXg6ICguKykNCi0gam9iX25hbWU6ICdBdXRoZW50aWNhdGUgZXhwb3J0ZXJzJw0KICBiYXNpY19hdXRoOg0KICAgIHVzZXJuYW1lOiAncHJvbWV0aGV1cycNCiAgICBwYXNzd29yZDogJ3RqQFZIOUVDeXRSRicNCiAgdGxzX2NvbmZpZzoNCiAgICBpbnNlY3VyZV9za2lwX3ZlcmlmeTogdHJ1ZQ0KICBjb25zdWxfc2RfY29uZmlnczoNCiAgICAtIHNlcnZlcjogJ2NvbnN1bC5zZXJ2aWNlLmRjMDEubG9jYWw6ODUwMCcNCiAgICAgIHRva2VuOiA3NDcxODI4Yy1kNTBhLTRiMjUtYjZhNS1kODBmMDJhMDNiYWUNCiAgICAgIHJlZnJlc2hfaW50ZXJ2YWw6IDYwcw0KICAgICAgc2VydmljZXM6IFsnYWxlcnRhX2V4cG9ydGVyJywgJ2dyYXlsb2dfZXhwb3J0ZXInXQ0KICAgICAgc2NoZW1lOiBodHRwcw0KICAgICAgdGxzX2NvbmZpZzoNCiAgICAgICAgaW5zZWN1cmVfc2tpcF92ZXJpZnk6IHRydWUNCiAgcmVsYWJlbF9jb25maWdzOg0KICAgIC0gcmVnZXg6IGpvYg0KICAgICAgYWN0aW9uOiBsYWJlbGRyb3ANCiAgICAtIHNvdXJjZV9sYWJlbHM6IFtfX21ldGFfY29uc3VsX3NlcnZpY2VfYWRkcmVzc10NCiAgICAgIHRhcmdldF9sYWJlbDogJ2lwYWRkcmVzcycNCiAgICAtIHJlZ2V4OiBfX21ldGFfY29uc3VsX3NlcnZpY2VfbWV0YWRhdGFfKC4rKQ0KICAgICAgYWN0aW9uOiBsYWJlbG1hcA0KICAgIC0gc291cmNlX2xhYmVsczogW19fbWV0YV9jb25zdWxfc2VydmljZV0NCiAgICAgIHJlcGxhY2VtZW50OiAnJHsxfScNCiAgICAgIHRhcmdldF9sYWJlbDogJ3NlcnZpY2UnDQogICAgICByZWdleDogJyhbXj1dKylfZXhwb3J0ZXInDQogICAgLSBzb3VyY2VfbGFiZWxzOiBbX19tZXRhX2NvbnN1bF9zZXJ2aWNlX21ldGFkYXRhX21ldHJpY3NfcGF0aF0NCiAgICAgIGFjdGlvbjogcmVwbGFjZQ0KICAgICAgdGFyZ2V0X2xhYmVsOiBfX21ldHJpY3NfcGF0aF9fDQogICAgICByZWdleDogKC4rKQ0KICAgIC0gc291cmNlX2xhYmVsczogW19fbWV0YV9jb25zdWxfc2VydmljZV9tZXRhZGF0YV9zY2hlbWVdDQogICAgICBhY3Rpb246IHJlcGxhY2UNCiAgICAgIHRhcmdldF9sYWJlbDogX19zY2hlbWVfXw0KICAgICAgcmVnZXg6ICguKykNCi0gam9iX25hbWU6ICdQcm9iZXJzJw0KICBjb25zdWxfc2RfY29uZmlnczoNCiAgICAtIHNlcnZlcjogJ2NvbnN1bC5zZXJ2aWNlLmRjMDEubG9jYWw6ODUwMCcNCiAgICAgIHRva2VuOiA3NDcxODI4Yy1kNTBhLTRiMjUtYjZhNS1kODBmMDJhMDNiYWUNCiAgICAgIHJlZnJlc2hfaW50ZXJ2YWw6IDYwcw0KICAgICAgc2VydmljZXM6IFsnYmxhY2tib3hfZXhwb3J0ZXJfcHJvYmVyJywgJ3Ntb2tlcGluZ19wcm9iZXJfcHJvYmVyJywgJ3NubXBfZXhwb3J0ZXJfcHJvYmVyJ10NCiAgICAgIHNjaGVtZTogaHR0cHMNCiAgICAgIHRsc19jb25maWc6DQogICAgICAgIGluc2VjdXJlX3NraXBfdmVyaWZ5OiB0cnVlDQogIHJlbGFiZWxfY29uZmlnczoNCiAgICAtIHJlZ2V4OiBqb2INCiAgICAgIGFjdGlvbjogbGFiZWxkcm9wDQogICAgLSByZWdleDogX19tZXRhX2NvbnN1bF9zZXJ2aWNlX21ldGFkYXRhXyguKykNCiAgICAgIGFjdGlvbjogbGFiZWxtYXANCiAgICAtIHNvdXJjZV9sYWJlbHM6IFtfX21ldGFfY29uc3VsX3NlcnZpY2VfbWV0YWRhdGFfdGFyZ2V0XQ0KICAgICAgdGFyZ2V0X2xhYmVsOiAnX19wYXJhbV90YXJnZXQnDQogICAgLSBzb3VyY2VfbGFiZWxzOiBbX19tZXRhX2NvbnN1bF9zZXJ2aWNlX21ldGFkYXRhX21vZHVsZV0NCiAgICAgIHRhcmdldF9sYWJlbDogJ19fcGFyYW1fbW9kdWxlJw0KICAgIC0gc291cmNlX2xhYmVsczogW19fbWV0YV9jb25zdWxfc2VydmljZV9tZXRhZGF0YV9hZGRyZXNzXQ0KICAgICAgYWN0aW9uOiByZXBsYWNlDQogICAgICB0YXJnZXRfbGFiZWw6IF9fYWRkcmVzc19fDQogICAgICByZWdleDogKC4rKQ0KICAgIC0gc291cmNlX2xhYmVsczogW19fbWV0YV9jb25zdWxfc2VydmljZV9tZXRhZGF0YV9tZXRyaWNzX3BhdGhdDQogICAgICBhY3Rpb246IHJlcGxhY2UNCiAgICAgIHRhcmdldF9sYWJlbDogX19tZXRyaWNzX3BhdGhfXw0KICAgICAgcmVnZXg6ICguKyk="
                },
                stringData: {}
            }
        ],
        helm: [
            {
                namespace: "monitoring",
                name: "thanos-redis",
                chart: "../../_chart/redis-17.0.7.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "", // Must be empty string if local chart.
                version: "17.0.7",
                values: {
                    architecture: "standalone",
                    auth: { enabled: false, sentinel: false },
                    commonConfiguration: `appendonly no
maxmemory 512mb
tcp-keepalive 60
tcp-backlog 8192
maxclients 1000
bind 0.0.0.0
databases 2
save ""`,
                    master: {
                        resources: {
                            limits: { cpu: "300m", memory: "576Mi" },
                            requests: { cpu: "300m", memory: "576Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        podSecurityContext: {
                            enabled: true,
                            fsGroup: 1001,
                            sysctls: [{ name: "net.core.somaxconn", value: "8192" }]
                        },
                        persistence: { enabled: false }
                    },
                    metrics: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        serviceMonitor: {
                            enabled: true,
                            relabellings: [
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        }
                    },
                    sysctl: { enabled: true }
                }
            },
            {
                namespace: "monitoring",
                name: "thanos",
                chart: "../../_chart/thanos-11.1.4.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "", // Must be empty string if local chart.
                version: "11.1.4",
                values: {
                    existingObjstoreSecret: "configuration-secret",
                    query: {
                        enabled: true,
                        logLevel: "warn",
                        replicaLabel: ["prometheus_replica", "cluster"],
                        dnsDiscovery: {
                            enabled: true,
                            sidecarsService: "kube-prometheus-stack-thanos-discovery",
                            sidecarsNamespace: "monitoring"
                        },
                        stores: [],
                        extraFlags: ["--web.external-prefix=thanos-query", "--web.route-prefix=thanos-query", "--query.partial-response"],
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "1000m", memory: "1024Mi" },
                            requests: { cpu: "1000m", memory: "1024Mi" }
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
                            "--query-range.split-interval=1h",
                            "--query-range.max-retries-per-request=10",
                            "--query-range.max-query-parallelism=32",
                            "--query-range.partial-response", `--query-range.response-cache-config=
type: REDIS
config:
  addr: "thanos-redis-master:6379"
  dial_timeout: 10s
  read_timeout: 10s
  write_timeout: 10s
  pool_size: 200
  min_idle_conns: 20
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
`, `--labels.response-cache-config=
type: REDIS
config:
  addr: "thanos-redis-master:6379"
  dial_timeout: 10s
  read_timeout: 10s
  write_timeout: 10s
  pool_size: 200
  min_idle_conns: 20
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
`
                        ],
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "1000m", memory: "1024Mi" },
                            requests: { cpu: "1000m", memory: "1024Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" }
                    },
                    bucketweb: {
                        enabled: true,
                        logLevel: "warn",
                        extraFlags: ["--web.external-prefix=thanos-bucketweb", "--web.route-prefix=thanos-bucketweb"],
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
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
                        retentionResolutionRaw: "30d",
                        retentionResolution5m: "30d",
                        retentionResolution1h: "30d",
                        extraFlags: [
                            "--compact.cleanup-interval=1h",
                            "--compact.concurrency=2"
                        ],
                        resources: {
                            limits: { cpu: "2000m", memory: "4096Mi" },
                            requests: { cpu: "2000m", memory: "4096Mi" }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
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
  addr: "thanos-redis-master:6379"
  dial_timeout: 10s
  read_timeout: 10s
  write_timeout: 10s
  pool_size: 200
  min_idle_conns: 20
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
`, `--store.caching-bucket.config=
type: REDIS
config:
  addr: "thanos-redis-master:6379"
  dial_timeout: 10s
  read_timeout: 10s
  write_timeout: 10s
  pool_size: 200
  min_idle_conns: 20
  max_get_multi_concurrency: 200
  get_multi_batch_size: 1000
  max_set_multi_concurrency: 200
  set_multi_batch_size: 1000
`
                        ],
                        replicaCount: 1,
                        resources: {
                            limits: { cpu: "1000m", memory: "2048Mi" },
                            requests: { cpu: "1000m", memory: "2048Mi" }
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
                    volumePermissions: {
                        enabled: true
                    }
                }
            },
            {
                namespace: "monitoring",
                name: "kube-prometheus-stack",
                chart: "../../_chart/kube-prometheus-stack-39.5.0.tgz",
                // repository: "https://prometheus-community.github.io/helm-charts",
                repository: "", // Must be empty string if local chart.                
                version: "39.5.0",
                values: {
                    defaultRules: { create: true },
                    alertmanager: {
                        enabled: true,
                        config: {},
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
                            image: {
                                repository: "registry.cn-hangzhou.aliyuncs.com/google_containers/alertmanager",
                                tag: "v0.24.0"
                            },
                            configSecret: "configuration-secret",
                            logLevel: "warn",
                            replicas: 1,
                            storage: {
                                volumeClaimTemplate: {
                                    spec: {
                                        storageClassName: "longhorn",
                                        resources: { requests: { storage: "1Gi", } }
                                    }
                                }
                            },
                            externalUrl: "https://norther.example.com/alertmanager/",
                            resources: {
                                limits: { cpu: "100m", memory: "128Mi" },
                                requests: { cpu: "100m", memory: "128Mi" }
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
                        image: {
                            repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/kube-state-metrics",
                            tag: "v2.5.0"
                        },
                        replicas: 1,
                        customLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        metricLabelsAllowlist: ["nodes=[*]"],
                        resources: {
                            limits: { cpu: "100m", memory: "256Mi" },
                            requests: { cpu: "100m", memory: "256Mi" }
                        },
                        prometheus: {
                            monitor: {
                                enabled: true,
                                relabelings: [
                                    { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                    { sourceLabels: ["___meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                                ]
                            }
                        }
                    },
                    nodeExporter: { enabled: true },
                    "prometheus-node-exporter": {
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        },
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
                                    repository: "registry.cn-hangzhou.aliyuncs.com/google_containers/kube-webhook-certgen",
                                    tag: "v1.1.1",
                                    sha: "64d8c73dca984af206adf9d6d7e46aa550362b1d7a01f3a0a91b20cc67868660"
                                }
                            }
                        },
                        podLabels: { customer: "demo", environment: "dev", project: "cluster", group: "norther", datacenter: "dc01", domain: "local" },
                        logLevel: "warn",
                        serviceMonitor: {
                            relabelings: [
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
                        image: { repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/prometheus-operator", tag: "v0.58.0" },
                        prometheusConfigReloader: {
                            image: { repository: "registry.cn-hangzhou.aliyuncs.com/goldstrike/prometheus-config-reloader", tag: "v0.58.0" },
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
                            serviceMonitorSelectorNilUsesHelmValues: false,
                            podMonitorSelectorNilUsesHelmValues: false,
                            retention: "1d",
                            retentionSize: "4096MB",
                            replicas: 1,
                            logLevel: "warn",
                            routePrefix: "/prometheus",
                            resources: {
                                limits: { cpu: "1000m", memory: "2048Mi" },
                                requests: { cpu: "1000m", memory: "2048Mi" }
                            },
                            storageSpec: {
                                volumeClaimTemplate: {
                                    spec: {
                                        storageClassName: "longhorn",
                                        resources: { requests: { storage: "8Gi" } }
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
            }
        ],
        /**
                yaml: [
                    { name: "../_rules/severity/alertmanager-prometheusRule.yaml" },
                    { name: "../_rules/severity/kubePrometheus-prometheusRule.yaml" },
                    { name: "../_rules/severity/kubeStateMetrics-prometheusRule.yaml" },
                    { name: "../_rules/severity/kubernetesControlPlane-prometheusRule.yaml" },
                    { name: "../_rules/severity/nodeExporter-prometheusRule.yaml" },
                    { name: "../_rules/severity/prometheus-prometheusRule.yaml" },
                    { name: "../_rules/severity/prometheusOperator-prometheusRule.yaml" }
                ]
         */
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
    // Create Prometheus rules.
    /**
    for (var yaml_index in deploy_spec[i].yaml) {
        const guestbook = new k8s.yaml.ConfigFile(deploy_spec[i].yaml[yaml_index].name, {
            file: deploy_spec[i].yaml[yaml_index].name,
            skipAwait: true,
        }, { dependsOn: [namespace] });
    }
     */
}