import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../../module/pulumi-ts-module-kubernetes';
import { ClusterTrustBundle } from "@pulumi/kubernetes/certificates/v1alpha1";

let config = new pulumi.Config();

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "consul",
                    annotations: {},
                    labels: {}
                },
                spec: {}
            }
        ],
        secret: [
            {
                metadata: {
                    name: "consul-bootstrap-acl-token",
                    namespace: "consul",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "token": Buffer.from(config.require("tokensMaster")).toString('base64')
                }
            },
            {
                metadata: {
                    name: "consul-ca-cert",
                    namespace: "consul",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "key": "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBMGdwSzNMREZZS2liNVhaczBJbEVML016eDRXZExoaEhDUGVpWU5OS2t4S25WYVVLCkUrTS9CMUsraFRabVlMZkc1VkFPWmdrZHBXcjdwZm1QU045cVd5S05xZGVyQUh6UXU4QTRZYnhiU1NRVkRLVmMKcFFDYUhFZmpjRUtqbDB6RElYMU1LekppQXJKNFlQVENpeGdEbG5pMTk1Qm1EQncxMDBZR2EzancrRHhTTExsUgo4VEE3eWVMdS8wTm1EVTMxLzN1NWZBVlorVnFzbmx2bitySjg3Wnpka2txNEVQUFhvanBiRElvbCtUTDFCSVcrCktOTE13WjRnOEFHbWR6ZlJQK3p0bU5xbksvTTdqK0toSzdYSTJZcHZrZGhTQ1htZHgvZ1VzNVM4eG1oUFhLY1MKTEZZaFdzeGozd285WlhzbXdBamZRYVM2WmZ5NCtGN2p1bkJsRFFJREFRQUJBb0lCQUJEME43cThvaEg5U2lncAplUHNVT1diTmNMNklNSG5LQitIWGEwbjVoQ2wrOWZiWnpZaHhiV0wvOE5UNzRTT3BjZXFNbmJ6cXUzUGd3Tk5TCjQ1ZjBRTGQrZ0lUWEhieDZWcmJ3K3h3WWdoM1RSY2V4aVZyZ1E1QkkxVGo0aUEvc2FFdkp1MTQ1UU9RSzErQ3IKb1JCdExjejFqV3FnUXp4ekFuMDlSOE5oRGNKYnBxSGpJY3Q1QkNXRHRXTmVGcDNrQ1RvMVRieUFZQkFyNThKaQpXdEtROWcvckhpdTlEQy85cmZlUVROdllrR1gxZmdFb3dsNm1XalRWZWY5WnZpcHB5S2duNStObWRnbTluU2I1Cis2Sk01YmdJdVYxLytCeC9jR1NXbmxaemlrY2E2Tnc1VU1TYVA2UjdCZnlVcVFDVDBHT3RVNHY3REgvZ25DUWcKdFJpWDVoa0NnWUVBOUY4RXZ5UzU2eVNxTktSZm9TUlVmNkhNMEZjelA0ZlBBUjFXWk5TN2E5bk5POCtUV2w0YQpVUnRTejZPbmEzcjBwQ0JqbzB4UUYrSWlqOXhuRTVNbFhlZ2tWSy90QUxVZkVFYVBrRFFGZ0d5RjBBM20ySHRxCkoxUDg2TDZ6NUxkVGhjd0dudGJVRmYwc1J3WFBjeGhpUjR3OXY5L0ZWRGFNTXBLLzFoNGhVazhDZ1lFQTNBa0wKL0tkYWprWE1Gd1k2R25oaFcxbkpQVUs0NlZpc1NsRUNqT0VRVEN2YWtIMiswbmcwSHAxeFdSTGUyRi8wWDNsdwpDbSt3RHRPd3FZWUVsQXQzY1pxSitYQ0NWMkZESTg0b1FkUzVGdXhGVGpRNU5selJZU2loNDh5R04zV0ZRVHdmCnJUZGJ0SU5YQkMvclFJT2xLbFZMbUg3aE53RnBqak54NURoSHgrTUNnWUVBNitaQjdjY2xWckpaUUdJaEVxekEKaVVrSEwyUE9UQmp0SXRWUVRodnlKVVhtMGtNcXF3VEdnTjlRakxNZDdpcU91Vld1K2JlMFphbmQxV1JkZU04RwpObVhmbElVVDFDZ0VLYkVENjUvY1k4SGZWeDNrWjd5VG1BMkN5cWMxZjZmZGovNkpzWklPd0g5YTIrRG5CdU5XCkZGMTBTcUpZbWxmaDlQd25CaXFsM2c4Q2dZQTlCV2xFblNqWThmUmlva0IwM05PcklPQlZVKzZ5RC94Zjg4MXcKUW01aG9YdlF2SDZ5SWRIYWQ3RmFrWWdwbTVySzY0T3Q4VUZ6S3pRQUg0R2ZpUHFNRDk2WnhhRHdHTElrK09SagpOVnBMU0NVRVJpbGpzU1FEL04vQXJCVEF4cCs0OHJLYU9CTC9vYmo5R1VqMXNFeWF5K0xXSE1IYW5sS210QSt1Cnlnam1Id0tCZ1FDTU56c3dWN3VNaFlIVUN4TmFkcmNDeVpJbGM4UUEwYkxNWTR5L3Y5TVY1SnIyeXNpWGxCN3YKeVg0OTdxZkRvQWkvZStmcHVQc0szZklIQklPazA2dVNLOTZ3MlZNMTZnQTNzRkFtRjcwRHRNdWdTazcyTmVTSwo3bFZjQ2JLeGF5ejdWeEZHNGxPZWVlR2F3b09qY0NYZGdNRzkzU3lrQ2h5U05yZk4xdmROekE9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQ==",
                    "cert": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURSRENDQWl3Q0NRQ0xMNHQ3MUp0MW9qQU5CZ2txaGtpRzl3MEJBUXNGQURCa01Rc3dDUVlEVlFRR0V3SlkKV0RFTk1Bc0dBMVVFQ0F3RVRXRnljekVXTUJRR0ExVUVCd3dOVFc5MWJuUWdUMng1YlhCMWN6RVFNQTRHQTFVRQpDZ3dIUTI5dGNHRnVlVEVOTUFzR0ExVUVDd3dFVlc1cGRERU5NQXNHQTFVRUF3d0VVazlQVkRBZUZ3MHlNREEyCk1URXdPVEUyTXpsYUZ3MDBNREEyTVRFd09URTJNemxhTUdReEN6QUpCZ05WQkFZVEFsaFlNUTB3Q3dZRFZRUUkKREFSTllYSnpNUll3RkFZRFZRUUhEQTFOYjNWdWRDQlBiSGx0Y0hWek1SQXdEZ1lEVlFRS0RBZERiMjF3WVc1NQpNUTB3Q3dZRFZRUUxEQVJWYm1sME1RMHdDd1lEVlFRRERBUlNUMDlVTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGCkFBT0NBUThBTUlJQkNnS0NBUUVBMGdwSzNMREZZS2liNVhaczBJbEVML016eDRXZExoaEhDUGVpWU5OS2t4S24KVmFVS0UrTS9CMUsraFRabVlMZkc1VkFPWmdrZHBXcjdwZm1QU045cVd5S05xZGVyQUh6UXU4QTRZYnhiU1NRVgpES1ZjcFFDYUhFZmpjRUtqbDB6RElYMU1LekppQXJKNFlQVENpeGdEbG5pMTk1Qm1EQncxMDBZR2EzancrRHhTCkxMbFI4VEE3eWVMdS8wTm1EVTMxLzN1NWZBVlorVnFzbmx2bitySjg3Wnpka2txNEVQUFhvanBiRElvbCtUTDEKQklXK0tOTE13WjRnOEFHbWR6ZlJQK3p0bU5xbksvTTdqK0toSzdYSTJZcHZrZGhTQ1htZHgvZ1VzNVM4eG1oUApYS2NTTEZZaFdzeGozd285WlhzbXdBamZRYVM2WmZ5NCtGN2p1bkJsRFFJREFRQUJNQTBHQ1NxR1NJYjNEUUVCCkN3VUFBNElCQVFCRHJGL2NlSFd6WHdvYkhvUExMd2krbUp4R3NTNlJPVTNRczJzaUxkQnozNzROTWZBMlN0a2UKTWo0dU9UdmN2Z3psL3lNTVZMZy9zUVhMeW8vZ0VhOVlhNFhkWDRxTmlEY0NwM3g2SjNnbWtsMGtxTzY4N3lRSgpFdW1FV1VXcmZ4Z2p4dEhSMUMvY1RFZ3FjNkYwUldHc1YrMjNkT0JvTG9RQmt2NGNUbGR5ajBGTERJZElId2p3CkFXM1B5MTJZb2JKNTRsdjhqbGZhVUVmNXg3Z3d5TW55MDR1aDRoTTVNR01WR29mK3dRWnVNNGJZMzBkVjUyNnkKQU9xeDEzY0hKek1CRW14aFdRNWdkUDNjOXdKcVVuSSswMDJPTjdiWnI5bVV0Q0Vab0JTdTQxb1Q4bGhjNG00ZApZQjJjak5wTXVSTGpjUzZHZTVyQUJweUFGWW9UVGhYdgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t"
                },
                stringData: {}
            },
        ],
        release: [
            {
                namespace: "consul",
                name: "consul",
                chart: "consul",
                repositoryOpts: {
                    repo: "https://helm.releases.hashicorp.com"
                },
                version: "1.5.3",
                values: {
                    global: {
                        logLevel: "warn",
                        domain: "home",
                        image: "swr.cn-east-3.myhuaweicloud.com/docker-io/consul:1.19.2",
                        imageK8S: "swr.cn-east-3.myhuaweicloud.com/docker-io/consul-k8s-control-plane:1.5.3",
                        datacenter: "local",
                        gossipEncryption: {
                            autoGenerate: true,
                            logLevel: "warn"
                        },
                        recursors: [
                            "192.168.0.1"
                        ],
                        tls: {
                            enabled: true,
                            logLevel: "warn",
                            verify: false,
                            caCert: {
                                secretName: "consul-ca-cert",
                                secretKey: "cert"
                            },
                            caKey: {
                                secretName: "consul-ca-cert",
                                secretKey: "key"
                            }
                        },
                        acls: {
                            manageSystemACLs: true,
                            logLevel: "warn",
                            bootstrapToken: {
                                secretName: "consul-bootstrap-acl-token",
                                secretKey: "token"
                            }
                        },
                        imageConsulDataplane: "swr.cn-east-3.myhuaweicloud.com/docker-io/consul-dataplane:1.5.3"
                    },
                    server: {
                        replicas: 1,
                        storage: "7Gi",
                        storageClass: "local-path",
                        resources: {
                            limits: { cpu: "200m", memory: "128Mi" },
                            requests: { cpu: "200m", memory: "128Mi" }
                        },
                        exposeService: {
                            enabled: true
                        }
                    },
                    ui: {
                        ingress: {
                            enabled: true,
                            ingressClassName: "traefik",
                            hosts: [
                                {
                                    host: "consul.home.local",
                                    paths: ["/"]
                                }
                            ],
                            "annotations": "nginx.ingress.kubernetes.io/ssl-passthrough: \"true\"\nnginx.ingress.kubernetes.io/backend-protocol: HTTPS\nnginx.ingress.kubernetes.io/configuration-snippet: |-\n  proxy_ssl_server_name on;\n  proxy_ssl_name $host;\nnginx.ingress.kubernetes.io/ssl-redirect: \"true\"\nnginx.ingress.kubernetes.io/secure-backends: \"true\"\n"
                        }
                    },
                    tests: {
                        enabled: false
                    }
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [secret] });