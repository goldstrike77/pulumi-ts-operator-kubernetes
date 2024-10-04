import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';

let config = new pulumi.Config();

const podlabels = {
    customer: "it",
    environment: "prd",
    project: "API-Gateway",
    group: "APISIX",
    datacenter: "cn-north",
    domain: "local"
}

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "apisix",
                    annotations: {
                        "openshift.io/sa.scc.mcs": "s0:c26,c25",
                        "openshift.io/sa.scc.supplemental-groups": "1000700000/10000",
                        "openshift.io/sa.scc.uid-range": "1000700000/10000"
                    },
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
                    name: "apisix-cert",
                    namespace: "apisix",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "key": btoa(`-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAvda7igM6ATb+W/Il5EPThasdlUn0IHPYdcwBCFEacAM3dUjp
5j434zeSf0Ju3NnxeFXTasQPyEPXS8uEy6VkfNMD2TLLECvYqsRAPxy6IRmdOjuY
X0MO4AJHKvu+1+d1PpFYyqGB8KspWoDaKPiCXMIs8EgsZD/gLC/k85aP4eFvE8Bq
3NKutJMTSx6aGUAztO+jw5nsyMYfNqhx6GEEEJP6dECicJ3WgIQnZ1bepBa9lckp
sXwTK9c3VZyLMfyCQ4Y6NXDav5nBFm21uQTfcxmWM6j/p1CtgoBAR0B+53A/WQ1s
IN1GTuWrJYREZi3nWoFacLwarZjEe1pQb2/C6wIDAQABAoIBADbhVwIFAMXNIidu
j2m3+fRQjZLU+FBRbShQu5Ot7pinNWcglw3Kutli/WTwzZ/nGZmSJjZdS7q3cgwl
X9SHkc9MKXam6nFYW6Cyb2hPY7eh8gQdqmUPu8MipXRVpsw/y3M1DZg2rJvov2G8
klT50qYCNH+aPcsVdDcR+Xw58Ip54vks0njiK9dtH5gR7qSSdx7l4E12bTM5etWW
9DqlWxM2GsTzkfBdfvp1zjnXJQgo4RMCtP14NCZrg2ajWnzGG7vaeTrNPjiU5X0P
S3RwwlwDOJaJN5bGLdr43Ho+Qiqmzz59GeI0xkT9pdJWha/qV0UjP4tFRSccDNfR
Nk1Pr7ECgYEA+TCmZzqEQ5DZyGbVzLNm0cYqcAP8/hLBSvnPoGCYwMA8xBuHDyf/
Fuflnx+Ebt21Bn/ruG1XxyTHgv+0os9oRa4NTHJ+dNUS2px7a9YqlEPEs/aOSOQX
+B3rOXy11aSWJiTIzWZuajJ/PNgyGjVY2/6MBgeXGBXCl8HucnPv+P8CgYEAwwbb
fCpyBs3hyboiESrr5fRS5pONw1CdbwtzGhiAmT438hG6Uem+8W3pFTB7TISNUMX8
CKc5Ki9U+EW1TaSXT4BWMCSGV3XnDSYGmpV6x4oqXdm9NWXiFmvQn0z6NiA4hbc4
97OBhu8U6jwu2AgGe4spnL9XNx97UfA5wz+ZqhUCgYAC1iTuw+HBiyKPf2wrmlcv
SBwvjjwRAFGm8tUENFVIzGdkrBOLfp8OubEJcKhnQqrO2iHqxYPcRnTm7tY1jDrZ
oDOSjTMXTV2bk3BsN9HgQi05BzNzbPVA48ZLrzm6ptb2tDB89g+Hse9019kqJzVN
u8YIQ4nawlSmuZRnRR6ULQKBgEA8d/qTuG8JTP82sZXZ/00EhnGv1Beq68/xg33q
6CCRX7f5otbsGJpIy2bRSytO1YTvUS5AdhGw+Vm1DByAw93JtZmxzhXsnae1CKPN
7Fzg40d6OlnmLuuXo2V0400Em9lfGgJsO5OIF+l23S8Gpav3kEMyurVLR0Eb0MrA
ngppAoGAbpmLHCkCyZAb3nj6kDyoCnxD+DZpQTpmT8nYYk8vEPlKSCG65cKojhLM
K/nGPN9hyV0eAXh9fzjgC6N54sCAtc9pIwk4lXOzuUmXhgHEkvezCBZuA2dnegqd
suv5rv+Q/F5I0h6AruIfxyGMsF5gzMCvm1Tk7h0iPfpy+ZtrjZU=
-----END RSA PRIVATE KEY-----`),
                    "cert": btoa(`-----BEGIN CERTIFICATE-----
MIIDhTCCAm2gAwIBAgIJANIIOlk5qZbQMA0GCSqGSIb3DQEBCwUAMGQxCzAJBgNV
BAYTAlhYMQ0wCwYDVQQIDARNYXJzMRYwFAYDVQQHDA1Nb3VudCBPbHltcHVzMRAw
DgYDVQQKDAdDb21wYW55MQ0wCwYDVQQLDARVbml0MQ0wCwYDVQQDDARST09UMB4X
DTIxMTIzMDAyMjExNVoXDTQxMTIzMDAyMjExNVowXTELMAkGA1UEBhMCWFgxFTAT
BgNVBAcMDERlZmF1bHQgQ2l0eTEcMBoGA1UECgwTRGVmYXVsdCBDb21wYW55IEx0
ZDEZMBcGA1UEAwwQaW5mby5leGFtcGxlLmNvbTCCASIwDQYJKoZIhvcNAQEBBQAD
ggEPADCCAQoCggEBAL3Wu4oDOgE2/lvyJeRD04WrHZVJ9CBz2HXMAQhRGnADN3VI
6eY+N+M3kn9CbtzZ8XhV02rED8hD10vLhMulZHzTA9kyyxAr2KrEQD8cuiEZnTo7
mF9DDuACRyr7vtfndT6RWMqhgfCrKVqA2ij4glzCLPBILGQ/4Cwv5POWj+HhbxPA
atzSrrSTE0semhlAM7Tvo8OZ7MjGHzaocehhBBCT+nRAonCd1oCEJ2dW3qQWvZXJ
KbF8EyvXN1WcizH8gkOGOjVw2r+ZwRZttbkE33MZljOo/6dQrYKAQEdAfudwP1kN
bCDdRk7lqyWERGYt51qBWnC8Gq2YxHtaUG9vwusCAwEAAaNBMD8wJQYDVR0RBB4w
HIINKi5leGFtcGxlLmNvbYILZXhhbXBsZS5jb20wCQYDVR0TBAIwADALBgNVHQ8E
BAMCBeAwDQYJKoZIhvcNAQELBQADggEBAF41mxL8/wDbqi9uzlCOui2nnLGTbmnE
4Giycu4KRBn8WmCGL0cUWVqNnnt+GZgpGzWrR2vx/gCe2imH41IhWMFS8MNE09JT
EP68WfQX0KEicyXYZzp4FzeM6UDxwCDah5w2OI3cwv75EXGPwCwVfSIeqTQcS0EX
XVbce0HEnP/Kh+D4P3880h+WgtvixQ5qILsed/jK+qvLB0lyCu6kW5ldr12QbD+M
cxDYpX0eK1122srafdhhhAFle9qHV4E0dNMOY2MDTHKSnGn0umXyru0C3hh54VF0
i818dy4JQSLzJDpiAUSsVpwo2UR4IiLXm5L8H+8CvVH2/1VJj9sj5s4=
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDRDCCAiwCCQCLL4t71Jt1ojANBgkqhkiG9w0BAQsFADBkMQswCQYDVQQGEwJY
WDENMAsGA1UECAwETWFyczEWMBQGA1UEBwwNTW91bnQgT2x5bXB1czEQMA4GA1UE
CgwHQ29tcGFueTENMAsGA1UECwwEVW5pdDENMAsGA1UEAwwEUk9PVDAeFw0yMDA2
MTEwOTE2MzlaFw00MDA2MTEwOTE2MzlaMGQxCzAJBgNVBAYTAlhYMQ0wCwYDVQQI
DARNYXJzMRYwFAYDVQQHDA1Nb3VudCBPbHltcHVzMRAwDgYDVQQKDAdDb21wYW55
MQ0wCwYDVQQLDARVbml0MQ0wCwYDVQQDDARST09UMIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEA0gpK3LDFYKib5XZs0IlEL/Mzx4WdLhhHCPeiYNNKkxKn
VaUKE+M/B1K+hTZmYLfG5VAOZgkdpWr7pfmPSN9qWyKNqderAHzQu8A4YbxbSSQV
DKVcpQCaHEfjcEKjl0zDIX1MKzJiArJ4YPTCixgDlni195BmDBw100YGa3jw+DxS
LLlR8TA7yeLu/0NmDU31/3u5fAVZ+Vqsnlvn+rJ87Zzdkkq4EPPXojpbDIol+TL1
BIW+KNLMwZ4g8AGmdzfRP+ztmNqnK/M7j+KhK7XI2YpvkdhSCXmdx/gUs5S8xmhP
XKcSLFYhWsxj3wo9ZXsmwAjfQaS6Zfy4+F7junBlDQIDAQABMA0GCSqGSIb3DQEB
CwUAA4IBAQBDrF/ceHWzXwobHoPLLwi+mJxGsS6ROU3Qs2siLdBz374NMfA2Stke
Mj4uOTvcvgzl/yMMVLg/sQXLyo/gEa9Ya4XdX4qNiDcCp3x6J3gmkl0kqO687yQJ
EumEWUWrfxgjxtHR1C/cTEgqc6F0RWGsV+23dOBoLoQBkv4cTldyj0FLDIdIHwjw
AW3Py12YobJ54lv8jlfaUEf5x7gwyMny04uh4hM5MGMVGof+wQZuM4bY30dV526y
AOqx13cHJzMBEmxhWQ5gdP3c9wJqUnI+002ON7bZr9mUtCEZoBSu41oT8lhc4m4d
YB2cjNpMuRLjcS6Ge5rABpyAFYoTThXv
-----END CERTIFICATE-----`)
                },
                stringData: {}
            },
            {
                metadata: {
                    name: "default-cert",
                    namespace: "apisix",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "key":  btoa(`-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAn/6gNdgLTv9r1CiU3VuLJgs9rnBR3IQCXssCejkE1Qq+bLm3
x2tBzyjaTdgocYgM4+326I7tkWvprbmZRxkeZ3S/ZglpCPFYs6iPDc5mt1DodLGe
xlnOTeMt1yl90wRi6yiiqnDgbc752x59XkcJx7JjXGGKLxjBJkiIijOK/yr1rPGC
iEY8efJPZX7TLTPaee9VeFaLCBmfqyMoARBFOVfRxiRlvZ2i46Qit6JWD41+IjGJ
UUqsv7iuo7sm5T9QsEV3GMMHWlvxXpYLpi/fVA/0+afF7KT1gWRx+YboxuAjTHfw
0yixqIcyjF7Jn4c2SclLcKS323J4xkd7UaWqjwIDAQABAoIBAGv+xouxuehn9pPt
lJZaLXHPkqIFhOwxWxw7Mf/oLv/S0bi4H3oHRxObQsfayWng6LqNrOVLXMaVLdWq
+vCH3wL8RhmM7o4vwqz6cR1jnefNQCtMnZzLj7r5Rr7+bcUbJ94NvscHjCXy2Kp0
STFzCAH4wqLf4BNsRSwfN7L5mbAkcRqlL7Qb+CODgfq2VHy/TD6R9VH3R5wsELdg
CoyxMQ7u4eZ7tDhw/znpTCb0saFbCslfjC7qjFlmfEsmjAagsSC3vDefH5zSHLmn
KsGkhr8kz9o64nQgWUY2YuTurLv1+/zP8V4qN6gJRvvhf/MvUKhjpiw0OMGviICm
ZcriymECgYEAytZsoQ+fOI87qu8Pn1KpBtaT51M0N/1GZVLoOH+r3fdIM1u82TiH
AT64Eu6fvgdHfdQ7tSqg4es4Nk9SvZKqta0Mm7VxRyWUBHIow0woMtoYMpQ/78eS
EKZl6fN7WzU0GeREpSyHcgXiq9n6strfXY/vqp3m1q6bA7o1SNHoExECgYEAye2d
BC+U6vpStCTnujvA9V2WeFAykiuQaWbuPaGyYQTYqpPsPDZyjGaQZSFsyzBv6+Wq
Me7BqYU1jCESfB+iHp5QlYfonGznrPeD8q6PKC/xY0xEsxk/DWVgDyj45E6OTyXB
Guxz2zY8KETuwh4cF1fYZesHC4TuCXugvAx+o58CgYEAoDdauqWSSKSqpswJ9Pjf
1izrys6n8om2bxZbozUFVmCawSZ3NsU1rkASObIOr5UkXTmkp+cyCQE4930Uh/Uv
ri0wRlW9UktWbWSW2hxvrCsk7d632fgzYb9txKu0BkkyDDmIF0fi/Ke1cbTOFzRX
NpoY3xW2XmCwxPLyX8CdpWECgYBQmW6WECQB0t8WFrEEDfvMNInuBhzZaVggKjyo
DxWzUgrls1uVASqhzgKOy1Owmunhn+9aNPHKJ2ijQUQulTXRwOFrfi8j2Ph0euuI
/5IWuWRBfVzinA4l27QG+RS3lH+LKge1JnJsKm7CqBkhFIGj86VlsPVD7NBSqq0S
wm3+AwKBgQCJkDMWa6Zzfeq7FulpwRcT+4/wTmhWXZ5TFcedFaIKiLypyfgV3Vq0
7Enf0S9tiZc6WxVFjdyEauR3d+zkvJRAqVnlFtBN1cfjRNE36dbcwbPV9KJ+dHDr
avl5c07ApaqbvyB2QtUyc+TH6l0JIdgzuIcbb83nmq5KA/q0kPGsDA==
-----END RSA PRIVATE KEY-----`),
                    "cert": btoa(`-----BEGIN CERTIFICATE-----
MIIDkDCCAnigAwIBAgIUNwXAmoU/jJqcF9ylisM6kIzMb6wwDQYJKoZIhvcNAQEL
BQAwZDELMAkGA1UEBhMCWFgxDTALBgNVBAgMBE1hcnMxFjAUBgNVBAcMDU1vdW50
IE9seW1wdXMxEDAOBgNVBAoMB0NvbXBhbnkxDTALBgNVBAsMBFVuaXQxDTALBgNV
BAMMBFJPT1QwHhcNMjQwNTEwMDgyODUwWhcNMzQwNTA4MDgyODUwWjBbMQswCQYD
VQQGEwJDTjEVMBMGA1UEBwwMRGVmYXVsdCBDaXR5MRwwGgYDVQQKDBNEZWZhdWx0
IENvbXBhbnkgTHRkMRcwFQYDVQQDDA5vYnMuaG9tZS5sb2NhbDCCASIwDQYJKoZI
hvcNAQEBBQADggEPADCCAQoCggEBAJ/+oDXYC07/a9QolN1biyYLPa5wUdyEAl7L
Ano5BNUKvmy5t8drQc8o2k3YKHGIDOPt9uiO7ZFr6a25mUcZHmd0v2YJaQjxWLOo
jw3OZrdQ6HSxnsZZzk3jLdcpfdMEYusooqpw4G3O+dsefV5HCceyY1xhii8YwSZI
iIoziv8q9azxgohGPHnyT2V+0y0z2nnvVXhWiwgZn6sjKAEQRTlX0cYkZb2douOk
IreiVg+NfiIxiVFKrL+4rqO7JuU/ULBFdxjDB1pb8V6WC6Yv31QP9Pmnxeyk9YFk
cfmG6MbgI0x38NMosaiHMoxeyZ+HNknJS3Ckt9tyeMZHe1Glqo8CAwEAAaNDMEEw
JwYDVR0RBCAwHoIOb2JzLmhvbWUubG9jYWyCDCouaG9tZS5sb2NhbDAJBgNVHRME
AjAAMAsGA1UdDwQEAwIF4DANBgkqhkiG9w0BAQsFAAOCAQEAtQvd5vF3UcW2QuSu
0yEc7pG+Mip39ZJ00pi2sMnc/PCHZIZKeHiiy3Yv+MCEXSMaZLu2FwQ51QZWnuN6
cRN1xz09dPOL7gij2YTIaPsnFwCC5zTW2UxxCVxfGMm48gtFvl8LGwyv5apQm2Il
frlRUpLjzA83fX3mh5CBb5FI33XsPny9OzAA3ca9yWYFJK2MESrc6wR6ikfx23yx
NzBk6tpuqLlGP1OhWRVd/BblllruMdkxtNjja6n2R7i8D7RHluzbxeqA7pji9sOW
spUsKGz3lm8QMYY5R/Ag5JDaMmAm2mocPTlu4WQHAWcm/1XpWfnCasM7gJBvR751
nCc8MA==
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDRDCCAiwCCQCLL4t71Jt1ojANBgkqhkiG9w0BAQsFADBkMQswCQYDVQQGEwJY
WDENMAsGA1UECAwETWFyczEWMBQGA1UEBwwNTW91bnQgT2x5bXB1czEQMA4GA1UE
CgwHQ29tcGFueTENMAsGA1UECwwEVW5pdDENMAsGA1UEAwwEUk9PVDAeFw0yMDA2
MTEwOTE2MzlaFw00MDA2MTEwOTE2MzlaMGQxCzAJBgNVBAYTAlhYMQ0wCwYDVQQI
DARNYXJzMRYwFAYDVQQHDA1Nb3VudCBPbHltcHVzMRAwDgYDVQQKDAdDb21wYW55
MQ0wCwYDVQQLDARVbml0MQ0wCwYDVQQDDARST09UMIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEA0gpK3LDFYKib5XZs0IlEL/Mzx4WdLhhHCPeiYNNKkxKn
VaUKE+M/B1K+hTZmYLfG5VAOZgkdpWr7pfmPSN9qWyKNqderAHzQu8A4YbxbSSQV
DKVcpQCaHEfjcEKjl0zDIX1MKzJiArJ4YPTCixgDlni195BmDBw100YGa3jw+DxS
LLlR8TA7yeLu/0NmDU31/3u5fAVZ+Vqsnlvn+rJ87Zzdkkq4EPPXojpbDIol+TL1
BIW+KNLMwZ4g8AGmdzfRP+ztmNqnK/M7j+KhK7XI2YpvkdhSCXmdx/gUs5S8xmhP
XKcSLFYhWsxj3wo9ZXsmwAjfQaS6Zfy4+F7junBlDQIDAQABMA0GCSqGSIb3DQEB
CwUAA4IBAQBDrF/ceHWzXwobHoPLLwi+mJxGsS6ROU3Qs2siLdBz374NMfA2Stke
Mj4uOTvcvgzl/yMMVLg/sQXLyo/gEa9Ya4XdX4qNiDcCp3x6J3gmkl0kqO687yQJ
EumEWUWrfxgjxtHR1C/cTEgqc6F0RWGsV+23dOBoLoQBkv4cTldyj0FLDIdIHwjw
AW3Py12YobJ54lv8jlfaUEf5x7gwyMny04uh4hM5MGMVGof+wQZuM4bY30dV526y
AOqx13cHJzMBEmxhWQ5gdP3c9wJqUnI+002ON7bZr9mUtCEZoBSu41oT8lhc4m4d
YB2cjNpMuRLjcS6Ge5rABpyAFYoTThXv
-----END CERTIFICATE-----`)
                },
                stringData: {}
            }
        ],
        release: [
            {
                namespace: "apisix",
                name: "apisix",
                chart: "apisix",
                repositoryOpts: {
                    repo: "https://charts.apiseven.com"
                },
                version: "2.8.1",
                values: {
                    image:
                    {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/apisix",
                        tag: "3.9.1-debian"
                    },
                    replicaCount: 1,
                    resources: {
                        limits: { cpu: "300m", memory: "1024Mi" },
                        requests: { cpu: "300m", memory: "1024Mi" }
                    },
                    nodeSelector: {},
                    timezone: "Asia/Shanghai",
                    fullnameOverride: "apisix-gateway",
                    serviceAccount: { create: true },
                    rbac: { create: true },
                    service: {
                        type: "LoadBalancer",
                        externalTrafficPolicy: "Local"
                    },
                    metrics: {
                        serviceMonitor: {
                            enabled: false,
                            interval: "60s",
                            labels: podlabels
                        }
                    },
                    apisix: {
                        ssl: { enabled: true },
                        admin: {
                            credentials: {
                                admin: config.require("adminCredentials"),
                                viewer: config.require("viewerCredentials")
                            }
                        },
                        nginx: {
                            logs: {
                                enableAccessLog: false,
                                accessLogFormat: '$remote_addr - $remote_user [$time_local] $http_host \"$request\" $status $body_bytes_sent $request_time \"$http_referer\" \"$http_user_agent\" $upstream_addr $upstream_status $upstream_response_time \"$upstream_scheme://$upstream_host$upstream_uri\"',
                                accessLogFormatEscape: "default"
                            }
                        },
                        discovery: {
                            enabled: true,
                            registry: {
                                kubernetes: {},
                                dns: { servers: ["172.30.0.10:53"] }
                            }
                        },
                        prometheus: { enabled: true },
                        plugins: ["ai", "api-breaker", "authz-casbin", "authz-casdoor", "authz-keycloak", "aws-lambda", "azure-functions", "basic-auth", "batch-requests", "body-transformer", "cas-auth", "clickhouse-logger", "client-control", "consumer-restriction", "cors", "csrf", "datadog", "degraphql", "dubbo-proxy", "echo", "elasticsearch-logger", "example-plugin", "ext-plugin-post-req", "ext-plugin-post-resp", "ext-plugin-pre-req", "fault-injection", "file-logger", "forward-auth", "google-cloud-logging", "grpc-transcode", "grpc-web", "gzip", "hmac-auth", "http-logger", "inspect", "ip-restriction", "jwt-auth", "kafka-logger", "kafka-proxy", "key-auth", "ldap-auth", "limit-conn", "limit-count", "limit-req", "loggly", "log-rotate", "mocking", "node-status", "opa", "openfunction", "openid-connect", "opentelemetry", "openwhisk", "prometheus", "proxy-cache", "proxy-control", "proxy-mirror", "proxy-rewrite", "public-api", "real-ip", "redirect", "referer-restriction", "request-id", "request-validation", "response-rewrite", "rocketmq-logger", "server-info", "serverless-post-function", "serverless-pre-function", "skywalking", "skywalking-logger", "sls-logger", "splunk-hec-logging", "syslog", "tcp-logger", "tencent-cloud-cls", "traffic-split", "ua-restriction", "udp-logger", "uri-blocker", "wolf-rbac", "workflow", "zipkin"],
                        pluginAttrs: {
                            skywalking: {
                                service_name: "demo::APISIX",
                                service_instance_name: "$hostname",
                                "endpoint_addr": "http://192.168.0.103:12800",
                                report_interval: 15
                            }
                        }
                    },
                    externalEtcd: {
                        host: ["http://apisix-etcd-headless:2379"],
                        user: "root",
                        password: config.require("etcdPassword")
                    },
                    etcd: { enabled: false },
                    dashboard: {
                        enabled: true,
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/apisix-dashboard",
                            tag: "3.0.0-alpine"
                        },
                        replicaCount: 1,
                        labelsOverride: podlabels,
                        config: {
                            conf: {
                                etcd: {
                                    endpoints: ["http://apisix-etcd-headless:2379"],
                                    username: "root",
                                    password: config.require("etcdPassword")
                                },
                                log: {
                                    errorLog: {
                                        level: "warn"
                                    },
                                    accessLog: {
                                        level: "warn"
                                    }
                                }
                            },
                            authentication: {
                                users: [
                                    {
                                        username: "admin",
                                        password: config.require("dashboardPassword")
                                    }
                                ]
                            }
                        },
                        service: {
                            type: "LoadBalancer",
                            port: 8080
                        },
                        resources: {
                            limits: { cpu: "300m", memory: "128Mi" },
                            requests: { cpu: "300m", memory: "128Mi" }
                        },
                        nodeSelector: {}
                    },
                    "ingress-controller": { enabled: false }
                }
            },
            {
                namespace: "apisix",
                name: "apisix-ingress-controller",
                chart: "apisix-ingress-controller",
                repositoryOpts: {
                    repo: "https://charts.apiseven.com"
                },
                version: "0.14.0",
                values: {
                    replicaCount: 1,
                    image:
                    {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/apisix-ingress-controller",
                        tag: "1.8.0"
                    },
                    config: {
                        logLevel: "error",
                        apisix: {
                            serviceName: "apisix-gateway-admin",
                            serviceNamespace: "apisix",
                            adminKey: config.require("adminCredentials"),
                            adminAPIVersion: "v3"
                        }
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    initContainer: {
                        image: "swr.cn-east-3.myhuaweicloud.com/docker-io/busybox",
                        tag: "1.36.1"
                    },
                    nodeSelector: {},
                    serviceMonitor: {
                        enabled: false,
                        interval: "60s",
                        labels: podlabels
                    }

                }
            },
            {
                namespace: "apisix",
                name: "etcd",
                chart: "etcd",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "9.8.2",
                values: {
                    fullnameOverride: "apisix-etcd",
                    image:
                    {
                        registry: "swr.cn-east-3.myhuaweicloud.com",
                        repository: "docker-io/etcd",
                        tag: "3.5.11-debian-11-r2"
                    },
                    auth: {
                        rbac: {
                            create: true,
                            allowNoneAuthentication: true,
                            rootPassword: config.require("etcdPassword")
                        }
                    },
                    autoCompactionMode: "periodic",
                    autoCompactionRetention: "1h",
                    initialClusterState: "new",
                    logLevel: "error",
                    //                    extraEnvVars: [
                    //                        { name: "ETCD_QUOTA_BACKEND_BYTES", value: "4294967296" }
                    //                    ],
                    replicaCount: 1,
                    podSecurityContext: {
                        fsGroup: 1000700000
                    },
                    containerSecurityContext: {
                        runAsUser: 1000700000
                    },
                    resources: {
                        limits: { cpu: "500m", memory: "512Mi" },
                        requests: { cpu: "500m", memory: "512Mi" }
                    },
                    podLabels: podlabels,
                    persistence: {
                        enabled: true,
                        storageClass: "vsphere-san-sc",
                        size: "7Gi"
                    },
                    volumePermissions: { enabled: false },
                    metrics: {
                        enabled: true,
                        podMonitor: {
                            enabled: false,
                            interval: "60s",
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
                            rules: []
                        }
                    }
                }
            }
        ],
        customresource: [
            /**
            {
                apiVersion: "networking.k8s.io/v1",
                kind: "IngressClass",
                metadata: {
                    name: "apisix",
                    annotations: {},
                    labels: {}
                },
                spec: {
                    controller: "apisix.apache.org/ingress-controller"
                }
            },
             */
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "apisix-gateway",
                    namespace: "apisix"
                },
                spec: {
                    podMetricsEndpoints: [
                        {
                            interval: "60s",
                            scrapeTimeout: "30s",
                            path: "/apisix/prometheus/metrics",
                            scheme: "http",
                            targetPort: "prometheus",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { action: "replace", replacement: "demo", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "dev", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "API-Gateway", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "apisix", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "dc01", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["apisix"]
                    },
                    selector: {
                        matchLabels: {
                            "app.kubernetes.io/instance": "apisix",
                            "app.kubernetes.io/name": "apisix"
                        }
                    }
                }
            },
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "apisix-ingress-controller",
                    namespace: "apisix"
                },
                spec: {
                    podMetricsEndpoints: [
                        {
                            interval: "60s",
                            scrapeTimeout: "30s",
                            path: "/metrics",
                            scheme: "http",
                            targetPort: "http",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { action: "replace", replacement: "demo", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "dev", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "API-Gateway", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "apisix", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "dc01", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["apisix"]
                    },
                    selector: {
                        matchLabels: {
                            "app.kubernetes.io/instance": "apisix-ingress-controller",
                            "app.kubernetes.io/name": "apisix-ingress-controller"
                        }
                    }
                }
            },
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixClusterConfig",
                metadata: {
                    name: "default"
                },
                spec: {
                    monitoring: {
                        skywalking: {
                            enable: true,
                            sampleRatio: 1
                        },
                        prometheus: {
                            enable: true,
                            prefer_name: true
                        }
                    }
                }
            },
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixTls",
                metadata: {
                    name: "default-cert",
                    namespace: "apisix"
                },
                spec: {
                    hosts: ["obs.home.local", "*.home.local"],
                    secret: {
                        name: "default-cert",
                        namespace: "apisix"
                    }
                }
            },
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixGlobalRule",
                metadata: {
                    name: "default",
                    namespace: "apisix"
                },
                spec: {
                    plugins: [
                        {
                            name: "udp-logger",
                            enable: true,
                            config: {
                                host: "192.168.0.104",
                                port: 1514,
                                batch_max_size: 1,
                                name: "udp logger",
                                log_format: {
                                    "@timestamp": "$time_iso8601",
                                    "upstream_response_time": "$upstream_response_time",
                                    "upstream_header_time": "$upstream_header_time",
                                    "upstream_connect_time": "$upstream_connect_time",
                                    "route_name": "$route_name",
                                    "remote_addr": "$remote_addr",
                                    "body_bytes_sent": "$body_bytes_sent",
                                    "host": "$host",
                                    "http_referer": "$http_referer",
                                    "http_user_agent": "$http_user_agent",
                                    "request_uri": "$request_uri",
                                    "request_length": "$request_length",
                                    "request_method": "$request_method",
                                    "request_time": "$request_time",
                                    "status": "$status",
                                    "scheme": "$scheme",
                                    "server_port": "$server_port",
                                    "server_protocol": "$server_protocol",
                                    "ssl_cipher": "$ssl_cipher",
                                    "ssl_protocol": "$ssl_protocol",
                                    "upstream_addr": "$upstream_addr"
                                }
                            }
                        },
                        {
                            name: "skywalking-logger",
                            enable: true,
                            config: {
                                endpoint_addr: "http://192.168.0.103:12800",
                                service_name: "demo::APISIX",
                                service_instance_name: "$hostname"
                            }
                        },
                        {
                            name: "real-ip",
                            enable: true,
                            config: {
                                source: "http_x_forwarded_for",
                                trusted_addresses: ["127.0.0.0/24", "10.0.0.0/8"],
                                recursive: true
                            }
                        },
                        {
                            name: "redirect",
                            enable: true,
                            config: {
                                http_to_https: true
                            }
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
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [release] });