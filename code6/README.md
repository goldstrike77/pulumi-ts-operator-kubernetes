#### Installing the Chart.
```hcl
helm repo add bitnami https://charts.bitnami.com/bitnami
```

#### Configuration credential values.
```hcl
pulumi config set rootPassword [password] --secret
pulumi config set userPassword [password] --secret
```


#### Enforce HTTPS.
```hcl
app/Providers/AppServiceProvider.php
line 32:  \Illuminate\Support\Facades\URL::forceScheme('https');
```

#### Start to create an administrator account for the first time.
```hcl
/var/www/html# php artisan code6:user-add admin@example.com password
```