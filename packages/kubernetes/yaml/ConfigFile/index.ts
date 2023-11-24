import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface ConfigFileArgs {
    resources: pulumi.Inputs
}

export class ConfigFile extends pulumi.ComponentResource {
    public readonly resources: k8s.yaml.ConfigFile
    constructor(
        name: string,
        args: ConfigFileArgs,
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super('empty:module:ConfigFile', name, {}, opts)
        for (var i in args.resources) {
            for (var j in args.resources[i].configfile) {
                this.resources = new k8s.yaml.ConfigFile(args.resources[i].configfile[j].file,
                    {
                        file: args.resources[i].configfile[i].file,
                        resourcePrefix: args.resources[i].configfile.resourcePrefix || null,
                        transformations: args.resources[i].configfile.transformations || [],
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