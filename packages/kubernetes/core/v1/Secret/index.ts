import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface SecretArgs {
    resources: pulumi.Inputs
}

export class Secret extends pulumi.ComponentResource {
    public readonly resources: k8s.core.v1.Secret
    constructor(
        name: string,
        args: SecretArgs,
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super('empty:module:Secret', name, {}, opts)
        for (var i in args.resources) {
            for (var j in args.resources[i].secret) {
                this.resources = new k8s.core.v1.Secret(args.resources[i].secret[j].metadata.name,
                    {
                        data: args.resources[i].secret[j].data || {},
                        immutable: args.resources[i].secret[j].immutable || false,
                        metadata: args.resources[i].secret[j].metadata || {},
                        stringData: args.resources[i].secret[j].stringData || {},
                        type: args.resources[i].secret[j].type || "Opaque",
                    },
                    {
                        parent: this,
                        protect: opts?.protect,
                        dependsOn: opts?.dependsOn
                    }
                )
            }
        }
    }
}