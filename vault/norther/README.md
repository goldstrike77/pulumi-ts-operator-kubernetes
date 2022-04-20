#### Initialize one Vault server with the default number of key shares and default key threshold, The output displays the key shares and initial root key generated.
```hcl
kubectl -n vault exec -ti vault-0 -- vault operator init -key-shares=5 -key-threshold=2
```