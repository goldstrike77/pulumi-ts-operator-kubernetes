import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface NamespaceArgs {
    resources: pulumi.Inputs
}

export class Namespace extends pulumi.ComponentResource {
    public readonly resources: k8s.core.v1.Namespace
    constructor(
        name: string,
        args: NamespaceArgs,
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super('empty:module:Namespace', name, {}, opts)
        for (var i in args.resources) {
            this.resources = new k8s.core.v1.Namespace(args.resources[i].namespace.metadata.name,
                {
                    metadata: args.resources[i].namespace.metadata,
                    spec: args.resources[i].namespace.spec
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