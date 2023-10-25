import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
  {
    namespace: {
      metadata: {
        name: "vsphere-cpi",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    helm: {
      namespace: "vsphere-cpi",
      name: "vsphere-cpi",
      chart: "../../_chart/vsphere-cpi-1.24.6.tgz",
      repository: "",
      version: "1.24.2",
      values: {
        config: {
          enabled: true,
          vcenter: "vcenter.esxi.lab",
          username: "administrator@vsphere.local",
          password: config.require("VSPHERE_PASSWORD"),
          datacenter: "Demo"
        },
        podSecurityPolicy: { enabled: true },
        daemonset: {
          image: "rancher/mirrored-cloud-provider-vsphere-cpi-release-manager",
          tag: "v1.24.6",
          replicaCount: 1,
          resources: {
            limits: { cpu: "100m", memory: "128Mi" },
            requests: { cpu: "100m", memory: "128Mi" }
          },
          podLabels: { customer: "demo", environment: "dev", project: "CPI", group: "vSphere", datacenter: "dc01", domain: "local" },
        }
      }
    }
  }
]

for (var i in deploy_spec) {
  // Create Kubernetes Namespace.
  const namespace = new k8s.core.v1.Namespace(deploy_spec[i].namespace.metadata.name, {
    metadata: deploy_spec[i].namespace.metadata,
    spec: deploy_spec[i].namespace.spec
  });
  // Create Release Resource.
  const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
    namespace: deploy_spec[i].helm.namespace,
    name: deploy_spec[i].helm.name,
    chart: deploy_spec[i].helm.chart,
    version: deploy_spec[i].helm.version,
    values: deploy_spec[i].helm.values,
    skipAwait: true,
  }, { dependsOn: [namespace] });
}