import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

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
                name: "thanos-store-memcached-index",
                chart: "../../_chart/memcached-6.0.2.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "", // Must be empty string if local chart.
                version: "6.0.2",
                values: "./memcached.yaml"
            },
            {
                namespace: "monitoring",
                name: "thanos-store-memcached-bucket",
                chart: "../../_chart/memcached-6.0.2.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "", // Must be empty string if local chart.
                version: "6.0.2",
                values: "./memcached.yaml"
            },
            {
                namespace: "monitoring",
                name: "thanos-queryfrontend-memcached",
                chart: "../../_chart/memcached-6.0.2.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "", // Must be empty string if local chart.
                version: "6.0.2",
                values: "./memcached.yaml"
            },
            {
                namespace: "monitoring",
                name: "thanos",
                chart: "../../_chart/thanos-9.0.3.tgz",
                // repository: "https://charts.bitnami.com/bitnami",
                repository: "", // Must be empty string if local chart.
                version: "9.0.3",
                values: "./thanos.yaml"
            },
            {
                namespace: "monitoring",
                name: "kube-prometheus-stack",
                chart: "../../_chart/kube-prometheus-stack-31.0.0.tgz",
                // repository: "https://prometheus-community.github.io/helm-charts",
                repository: "", // Must be empty string if local chart.                
                version: "31.0.0",
                values: "./kube-prometheus-stack.yaml"
            }
        ],
        yaml: [
            { name: "../_rules/severity/alertmanager.rules.yaml" },
            { name: "../_rules/severity/config-reloaders.yaml" },
            { name: "../_rules/severity/general.rules.yaml" },
            { name: "../_rules/severity/k8s.rules.yaml" },
            { name: "../_rules/severity/kube-apiserver-availability.rules.yaml" },
            { name: "../_rules/severity/kube-apiserver-burnrate.rules.yaml" },
            { name: "../_rules/severity/kube-apiserver-histogram.rules.yaml" },
            { name: "../_rules/severity/kube-apiserver.rules.yaml" },
            { name: "../_rules/severity/kube-apiserver-slos.yaml" },
            { name: "../_rules/severity/kubelet.rules.yaml" },
            { name: "../_rules/severity/kube-prometheus-general.rules.yaml" },
            { name: "../_rules/severity/kube-prometheus-node-recording.rules.yaml" },
            { name: "../_rules/severity/kubernetes-apps.yaml" },
            { name: "../_rules/severity/kubernetes-resources.yaml" },
            { name: "../_rules/severity/kubernetes-storage.yaml" },
            { name: "../_rules/severity/kubernetes-system-apiserver.yaml" },
            { name: "../_rules/severity/kubernetes-system-kubelet.yaml" },
            { name: "../_rules/severity/kubernetes-system.yaml" },
            { name: "../_rules/severity/kube-state-metrics.yaml" },
            { name: "../_rules/severity/node-exporter.rules.yaml" },
            { name: "../_rules/severity/node-exporter.yaml" },
            { name: "../_rules/severity/node-network.yaml" },
            { name: "../_rules/severity/node.rules.yaml" },
            { name: "../_rules/severity/prometheus-operator.yaml" },
            { name: "../_rules/severity/prometheus.yaml" }
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
    // Create Release Resource.
    for (var helm_index in deploy_spec[i].helm) {
        if (deploy_spec[i].helm[helm_index].repository === "") {
            const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
                namespace: deploy_spec[i].helm[helm_index].namespace,
                name: deploy_spec[i].helm[helm_index].name,
                chart: deploy_spec[i].helm[helm_index].chart,
                version: deploy_spec[i].helm[helm_index].version,
                valueYamlFiles: [new FileAsset(deploy_spec[i].helm[helm_index].values)],
                skipAwait: true,
            }, { dependsOn: [namespace] });
        }
        else {
            const release = new k8s.helm.v3.Release(deploy_spec[i].helm[helm_index].name, {
                namespace: deploy_spec[i].helm[helm_index].namespace,
                name: deploy_spec[i].helm[helm_index].name,
                chart: deploy_spec[i].helm[helm_index].chart,
                version: deploy_spec[i].helm[helm_index].version,
                valueYamlFiles: [new FileAsset(deploy_spec[i].helm[helm_index].values)],
                skipAwait: true,
                repositoryOpts: {
                    repo: deploy_spec[i].helm[helm_index].repository,
                },
            }, { dependsOn: [namespace] });
        }
    }
    // Create Prometheus rules.
    for (var yaml_index in deploy_spec[i].yaml) {
        const guestbook = new k8s.yaml.ConfigFile(deploy_spec[i].yaml[yaml_index].name, {
            file: deploy_spec[i].yaml[yaml_index].name,
            skipAwait: true,
        }, { dependsOn: [namespace] });
    }
}