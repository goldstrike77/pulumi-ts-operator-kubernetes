import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
  {
    namespace: {
      metadata: {
        name: "crunchydata",
        annotations: {},
        labels: {}
      },
      spec: {}
    },
    helm: {
      namespace: "crunchydata",
      name: "postgres-operator",
      chart: "../../_chart/pgo-install-5.3.1.tgz",
      repository: "",
      version: "5.3.1",
      values: {
        singleNamespace: false,
        debug: true,
        resources: {
          controller: {
            limits: { cpu: "100m", memory: "128Mi" },
            requests: { cpu: "100m", memory: "128Mi" }
          },
          upgrade: {
            limits: { cpu: "100m", memory: "128Mi" },
            requests: { cpu: "100m", memory: "128Mi" }
          }
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