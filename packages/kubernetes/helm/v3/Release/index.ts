import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface ReleaseArgs {
    resources: pulumi.Inputs
}

export class Release extends pulumi.ComponentResource {
    public readonly resources: k8s.helm.v3.Release
    constructor(
        name: string,
        args: ReleaseArgs,
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super('empty:module:Release', name, {}, opts)
        for (var i in args.resources) {
            for (var j in args.resources[i].release) {
                this.resources = new k8s.helm.v3.Release(args.resources[i].release[j].name,
                    {
                        chart: args.resources[i].release[j].chart,
                        allowNullValues: args.resources[i].release[j].allowNullValues || true,
                        atomic: args.resources[i].release[j].atomic || false,
                        cleanupOnFail: args.resources[i].release[j].cleanupOnFail || false,
                        createNamespace: args.resources[i].release[j].createNamespace || false,
                        dependencyUpdate: args.resources[i].release[j].dependencyUpdate || false,
                        description: args.resources[i].release[j].description || null,
                        devel: args.resources[i].release[j].devel || false,
                        disableCRDHooks: args.resources[i].release[j].disableCRDHooks || false,
                        disableOpenapiValidation: args.resources[i].release[j].disableOpenapiValidation || false,
                        disableWebhooks: args.resources[i].release[j].disableWebhooks || false,
                        forceUpdate: args.resources[i].release[j].forceUpdate || false,
                        keyring: args.resources[i].release[j].keyring || null,
                        lint: args.resources[i].release[j].lint || false,
                        maxHistory: args.resources[i].release[j].maxHistory || 0,
                        name: args.resources[i].release[j].name,
                        namespace: args.resources[i].release[j].namespace,
                        postrender: args.resources[i].release[j].postrender || null,
                        recreatePods: args.resources[i].release[j].recreatePods || true,
                        renderSubchartNotes: args.resources[i].release[j].renderSubchartNotes || false,
                        replace: args.resources[i].release[j].replace || false,
                        repositoryOpts: args.resources[i].release[j].repositoryOpts || {},
                        resetValues: args.resources[i].release[j].resetValues || false,
                        resourceNames: args.resources[i].release[j].resourceNames || {},
                        reuseValues: args.resources[i].release[j].reuseValues || false,
                        skipAwait: args.resources[i].release[j].skipAwait || true,
                        skipCrds: args.resources[i].release[j].skipCrds || false,
                        timeout: args.resources[i].release[j].timeout || 1800,
                        values: args.resources[i].release[j].values,
                        verify: args.resources[i].release[j].verify || false,
                        version: args.resources[i].release[j].version,
                        waitForJobs: args.resources[i].release[j].waitForJobs || false
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