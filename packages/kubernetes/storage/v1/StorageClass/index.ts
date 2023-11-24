import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface StorageClassArgs {
    resources: pulumi.Inputs
}

export class StorageClass extends pulumi.ComponentResource {
    public readonly resources: k8s.storage.v1.StorageClass
    constructor(
        name: string,
        args: StorageClassArgs,
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super('empty:module:StorageClass', name, {}, opts)
        for (var i in args.resources) {
            for (var j in args.resources[i].storageclass) {
                this.resources = new k8s.storage.v1.StorageClass(args.resources[i].storageclass[j].metadata.name,
                    {
                        provisioner: args.resources[i].storageclass[j].provisioner,
                        allowVolumeExpansion: args.resources[i].storageclass[j].allowVolumeExpansion || true,
                        allowedTopologies: args.resources[i].storageclass[j].allowedTopologies || [],
                        metadata: args.resources[i].storageclass[j].metadata,
                        mountOptions: args.resources[i].storageclass[j].mountOptions || [],
                        parameters: args.resources[i].storageclass[j].parameters || {},
                        reclaimPolicy: args.resources[i].storageclass[j].reclaimPolicy || "Retain",
                        volumeBindingMode: args.resources[i].storageclass[j].volumeBindingMode || "Immediate"
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