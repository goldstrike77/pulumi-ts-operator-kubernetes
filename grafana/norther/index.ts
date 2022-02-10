import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";
import * as fs from 'fs';

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "visualization",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "grafana-ldap-toml",
                    namespace: "visualization",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "ldap-toml": ""
                },
                stringData: {}
            }
        ],
        configmap: [
            {
                metadata: {
                    name: "grafana-dashboards-extra",
                    namespace: "visualization",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "Kubernetes_Cluster.json": fs.readFileSync('./dashboards/platform/Kubernetes_Cluster.json', 'utf8'),
                    "Linux_System_Overview.json": fs.readFileSync('./dashboards/operatingsystem/Linux_System_Overview.json', 'utf8')
                }
            }
        ],
        helm: [
            {
                namespace: "visualization",
                name: "grafana",
                chart: "../../_chart/grafana-6.21.2.tgz",
                // repository: "https://grafana.github.io/helm-charts",
                repository: "", // Must be empty string if local chart.
                version: "6.21.2",
                values: "./grafana.yaml"
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
    // Create Kubernetes ConfigMap.
    for (var configmap_index in deploy_spec[i].configmap) {
        const configmap = new k8s.core.v1.ConfigMap(deploy_spec[i].configmap[configmap_index].metadata.name, {
            metadata: deploy_spec[i].configmap[configmap_index].metadata,
            data: deploy_spec[i].configmap[configmap_index].data,
        }, { dependsOn: [namespace] });
    }
    // Create Kubernetes Secret.
    // for (var secret_index in deploy_spec[i].secret) {
    //     const secret = new k8s.core.v1.Secret(deploy_spec[i].secret[secret_index].metadata.name, {
    //         metadata: deploy_spec[i].secret[secret_index].metadata,
    //         type: deploy_spec[i].secret[secret_index].type,
    //         data: deploy_spec[i].secret[secret_index].data,
    //         stringData: deploy_spec[i].secret[secret_index].stringData
    //     }, { dependsOn: [namespace] });
    // }
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
}