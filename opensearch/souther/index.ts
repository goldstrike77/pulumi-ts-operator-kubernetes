import * as k8s from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const deploy_spec = [
    {
        namespace: {
            metadata: {
                name: "opensearch",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret:
        {
            metadata: {
                name: "security-config-secret",
                namespace: "opensearch",
                annotations: {},
                labels: {}
            },
            type: "Opaque",
            data: {
                "internal_users.yml": "LS0tDQpfbWV0YToNCiAgdHlwZTogImludGVybmFsdXNlcnMiDQogIGNvbmZpZ192ZXJzaW9uOiAyDQoNCmFkbWluOg0KICBoYXNoOiAiJDJhJDEyJFVEaXpUaTFNMGJPS1BJSWpJb0UwRy5JOHpwZnNUTTFrWThMdmNPOGxuTjhXcWprWURwaE1lIg0KICByZXNlcnZlZDogdHJ1ZQ0KICBiYWNrZW5kX3JvbGVzOg0KICAtICJhZG1pbiINCiAgZGVzY3JpcHRpb246ICJEZW1vIGFkbWluIHVzZXIiDQoNCmtpYmFuYXNlcnZlcjoNCiAgaGFzaDogIiQyYSQxMiRWbDRNSTNzMXIzd0Z4LkxQdWtscE1PSFJheVVnb1JEQ3F1M3pTejV6Yk9xRnJMbzVGVm81LiINCiAgcmVzZXJ2ZWQ6IHRydWUNCiAgZGVzY3JpcHRpb246ICJEZW1vIE9wZW5TZWFyY2ggRGFzaGJvYXJkcyB1c2VyIg0KDQpraWJhbmFybzoNCiAgaGFzaDogIiQyYSQxMiRDdkFTck5FLkVsZi40c1lCazg0dTJ1NW45SGIvQW9pSm00VjZJUUR4UVlaS1ZOLmNPOGl4RyINCiAgcmVzZXJ2ZWQ6IGZhbHNlDQogIGJhY2tlbmRfcm9sZXM6DQogIC0gImtpYmFuYXVzZXIiDQogIC0gInJlYWRhbGwiDQogIGF0dHJpYnV0ZXM6DQogICAgYXR0cmlidXRlMTogInZhbHVlMSINCiAgICBhdHRyaWJ1dGUyOiAidmFsdWUyIg0KICAgIGF0dHJpYnV0ZTM6ICJ2YWx1ZTMiDQogIGRlc2NyaXB0aW9uOiAiRGVtbyBPcGVuU2VhcmNoIERhc2hib2FyZHMgcmVhZCBvbmx5IHVzZXIiDQoNCmxvZ3N0YXNoOg0KICBoYXNoOiAiJDJhJDEyJHovY0RuQmQ1NEdCZjBlOHBKNTNvc09mV3FjL2Ruci5QNXZVLjJCUXVOaDhWQkhBZlVvS3ZtIg0KICByZXNlcnZlZDogZmFsc2UNCiAgYmFja2VuZF9yb2xlczoNCiAgLSAibG9nc3Rhc2giDQogIGRlc2NyaXB0aW9uOiAiRGVtbyBsb2dzdGFzaCB1c2VyIg0KDQpyZWFkYWxsOg0KICBoYXNoOiAiJDJhJDEyJHV0NjB4VC5mMlNrZEpzRFY3MEMyY3U2Qzk5eGUzZDVBU1l3VEVIbEhBNkhVN2ZiaFdTV0RxIg0KICByZXNlcnZlZDogZmFsc2UNCiAgYmFja2VuZF9yb2xlczoNCiAgLSAicmVhZGFsbCINCiAgZGVzY3JpcHRpb246ICJEZW1vIHJlYWRhbGwgdXNlciINCg0Kc25hcHNob3RyZXN0b3JlOg0KICBoYXNoOiAiJDJhJDEyJFdEZXdrbWVoQ0pSOEQ5TWxKemlDYi54Rm1JdGk3am10d2gvNy5xSmN3aDlzMEZuM0plZlVDIg0KICByZXNlcnZlZDogZmFsc2UNCiAgYmFja2VuZF9yb2xlczoNCiAgLSAic25hcHNob3RyZXN0b3JlIg0KICBkZXNjcmlwdGlvbjogIkRlbW8gc25hcHNob3RyZXN0b3JlIHVzZXIi",
                "opensearch_dashboards.yml": "LS0tDQpsb2dnaW5nLnF1aWV0OiB0cnVlDQpvcGVuc2VhcmNoLmhvc3RzOiBbaHR0cHM6Ly9vcGVuc2VhcmNoLWNsdXN0ZXItbWFzdGVyOjkyMDBdDQpvcGVuc2VhcmNoLnNzbC52ZXJpZmljYXRpb25Nb2RlOiBub25lDQpvcGVuc2VhcmNoLnVzZXJuYW1lOiBraWJhbmFzZXJ2ZXINCm9wZW5zZWFyY2gucGFzc3dvcmQ6IHBhc3N3b3JkDQpvcGVuc2VhcmNoLnJlcXVlc3RIZWFkZXJzV2hpdGVsaXN0OiBbYXV0aG9yaXphdGlvbiwgc2VjdXJpdHl0ZW5hbnRdIA0Kb3BlbnNlYXJjaF9zZWN1cml0eS5tdWx0aXRlbmFuY3kuZW5hYmxlZDogdHJ1ZQ0Kb3BlbnNlYXJjaF9zZWN1cml0eS5tdWx0aXRlbmFuY3kudGVuYW50cy5wcmVmZXJyZWQ6IFtQcml2YXRlLCBHbG9iYWxdDQpvcGVuc2VhcmNoX3NlY3VyaXR5LnJlYWRvbmx5X21vZGUucm9sZXM6IFtraWJhbmFfcmVhZF9vbmx5XQ0Kb3BlbnNlYXJjaF9zZWN1cml0eS5jb29raWUuc2VjdXJlOiBmYWxzZQ0Kc2VydmVyLmhvc3Q6ICcwLjAuMC4wJw0Kc2VydmVyLnJld3JpdGVCYXNlUGF0aDogdHJ1ZQ0Kc2VydmVyLmJhc2VQYXRoOiAiL29wZW5zZWFyY2gi"
            },
            stringData: {}
        },
        helm: [
            {
                namespace: "opensearch",
                name: "opensearch",
                chart: "../../_chart/opensearch-2.1.0.tgz",
                // repository: "https://opensearch-project.github.io/helm-charts",
                repository: "", // Must be empty string if local chart.
                version: "2.1.0",
                values: "./opensearch.yaml"
            },
            {
                namespace: "opensearch",
                name: "opensearch-dashboards",
                chart: "../../_chart/opensearch-dashboards-2.1.0.tgz",
                // repository: "https://opensearch-project.github.io/helm-charts",
                repository: "", // Must be empty string if local chart.
                version: "2.1.0",
                values: "./opensearch-dashboards.yaml"
            }
            //            {
            //                namespace: "opensearch",
            //                name: "kubernetes-logging",
            //                chart: "../../_chart/kubernetes-logging-3.2.8.tgz",
            //                // repository: "logging https://nickytd.github.io/kubernetes-logging-helm",
            //                repository: "", // Must be empty string if local chart.
            //                version: "3.2.8",
            //                values: "./kubernetes-logging.yaml"
            //            }
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
    const secret = new k8s.core.v1.Secret(deploy_spec[i].secret.metadata.name, {
        metadata: deploy_spec[i].secret.metadata,
        type: deploy_spec[i].secret.type,
        data: deploy_spec[i].secret.data,
        stringData: deploy_spec[i].secret.stringData
    }, { dependsOn: [namespace] });
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
            }, { dependsOn: [secret], customTimeouts: { create: "10m" } });
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
            }, { dependsOn: [secret], customTimeouts: { create: "10m" } });
        }
    }
}