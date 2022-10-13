import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "vmware-exporter",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        helm: [
            {
                namespace: "vmware-exporter",
                name: "vmware-exporter",
                chart: "../../_chart/vmware-exporter.tgz",
                repository: "",
                version: "0.13.2",
                values: {
                    replicaCount: 1,
                    vsphere: {
                        user: "administrator@vsphere.local",
                        password: config.require("password"),
                        host: "vcenter.esxi.lab",
                        collectors: {
                            hosts: true,
                            datastores: true,
                            vms: true,
                            vmguests: true,
                            snapshots: false
                        }
                    },
                    image: { tag: "v0.18.3" },
                    service: { enabled: true },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    }
                }
            }
        ],
        servicemonitor: [
            { name: "./servicemonitor.yaml" },
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
        }, { dependsOn: [namespace] });
    }
    // Create service monitor.
    for (var yaml_index in deploy_spec[i].servicemonitor) {
        const guestbook = new k8s.yaml.ConfigFile(deploy_spec[i].servicemonitor[yaml_index].name, {
            file: deploy_spec[i].servicemonitor[yaml_index].name,
            skipAwait: true,
        }, { dependsOn: [namespace] });
    }
}