import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface CustomResourceArgs {
    resources: pulumi.Inputs
}

export class CustomResource extends pulumi.ComponentResource {
    public readonly resources: k8s.apiextensions.CustomResource
    constructor(
        name: string,
        args: CustomResourceArgs,
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super('empty:module:CustomResource', name, {}, opts)
        for (var i in args.resources) {
            for (var j in args.resources[i].customresource) {
                this.resources = new k8s.apiextensions.CustomResource(args.resources[i].customresource[j].metadata.name,
                    {
                        apiVersion: args.resources[i].customresource[j].apiVersion,
                        kind: args.resources[i].customresource[j].kind,
                        metadata: args.resources[i].customresource[j].metadata,
                        others: args.resources[i].customresource[j].others || {},
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