import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
  {
    helm: {
      namespace: "kube-system",
      name: "vsphere-cpi",
      chart: "vsphere-cpi",
      repository: "https://kubernetes.github.io/cloud-provider-vsphere",
      version: "1.28.0",
      values: {
        config: {
          enabled: true,
          vcenter: "192.168.0.130",
          username: "administrator@vsphere.local",
          password: config.require("VSPHERE_PASSWORD"),
          datacenter: "Demo"
        },
        podSecurityPolicy: { enabled: false },
        daemonset: {
          image: "registry.cn-shanghai.aliyuncs.com/goldenimage/mirrored-cloud-provider-vsphere-cpi-release-manager",
          tag: "v1.28.0",
          replicaCount: 1,
          resources: {
            limits: { cpu: "200m", memory: "256Mi" },
            requests: { cpu: "200m", memory: "256Mi" }
          },
          podLabels: { customer: "demo", environment: "dev", project: "CPI", group: "vSphere", datacenter: "dc01", domain: "local" },
        }
      }
    }
  }
]

for (var i in deploy_spec) {
  // Create Release Resource.
  const release = new k8s.helm.v3.Release(deploy_spec[i].helm.name, {
    namespace: deploy_spec[i].helm.namespace,
    name: deploy_spec[i].helm.name,
    chart: deploy_spec[i].helm.chart,
    version: deploy_spec[i].helm.version,
    values: deploy_spec[i].helm.values,
    skipAwait: false,
    repositoryOpts: {
      repo: deploy_spec[i].helm.repository,
    },
  });
}