import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

let config = new pulumi.Config();

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "mysql-operator",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        operator: {
            namespace: "mysql-operator",
            name: "mysql-operator",
            chart: "mysql-operator",
            repository: "https://mysql.github.io/mysql-operator",
            version: "2.0.11",
            values: {}
        },
        innodbcluster: {
            namespace: "mysql-operator",
            name: "mysql-innodbcluster",
            chart: "mysql-innodbcluster",
            repository: "https://mysql.github.io/mysql-operator",
            version: "2.0.11",
            values: {
                credentials: {
                    root: {
                        user: "root",
                        password: "password",
                        host: "%"
                    }
                },
                tls: {
                    useSelfSigned: true
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
    const operator = new k8s.helm.v3.Release(deploy_spec[i].operator.name, {
        namespace: deploy_spec[i].operator.namespace,
        name: deploy_spec[i].operator.name,
        chart: deploy_spec[i].operator.chart,
        version: deploy_spec[i].operator.version,
        values: deploy_spec[i].operator.values,
        skipAwait: true,
        repositoryOpts: {
            repo: deploy_spec[i].operator.repository,
        },
    }, { dependsOn: [namespace] });
    const mysql = new k8s.helm.v3.Release(deploy_spec[i].innodbcluster.name, {
        namespace: deploy_spec[i].innodbcluster.namespace,
        name: deploy_spec[i].innodbcluster.name,
        chart: deploy_spec[i].innodbcluster.chart,
        version: deploy_spec[i].innodbcluster.version,
        values: deploy_spec[i].innodbcluster.values,
        skipAwait: true,
        repositoryOpts: {
            repo: deploy_spec[i].innodbcluster.repository,
        },
    }, { dependsOn: [operator] });
}