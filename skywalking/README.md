#### Installing the Chart
```hcl
helm repo add opensearch https://opensearch-project.github.io/helm-charts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
```

#### Configuration credential values.
```hcl
pulumi config set kibanaserverPassword [password] --secret
pulumi config set adminPassword [password] --secret
```

templates/oap-svc.yaml 添加
```
{{- if .Values.oap.service.annotations }}
  annotations:
{{ toYaml .Values.oap.service.annotations | indent 4 }}
{{- end }}
spec:
```