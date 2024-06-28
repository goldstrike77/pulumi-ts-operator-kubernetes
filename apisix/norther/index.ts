import * as pulumi from "@pulumi/pulumi";
import * as k8s_module from '../../../module/pulumi-ts-module-kubernetes';

//const provider = new k8s.Provider("k8s", { enableServerSideApply: true });

let config = new pulumi.Config();

const podlabels = {
    customer: "demo",
    environment: "dev",
    project: "API-Gateway",
    group: "APISIX",
    datacenter: "dc01",
    domain: "local"
}

const resources = [
    {
        namespace: {
            metadata: {
                name: "apisix",
                annotations: {},
                labels: {}
            },
            spec: {}
        },
        secret: [
            {
                metadata: {
                    name: "apisix-cert",
                    namespace: "apisix",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "key": "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBdmRhN2lnTTZBVGIrVy9JbDVFUFRoYXNkbFVuMElIUFlkY3dCQ0ZFYWNBTTNkVWpwCjVqNDM0emVTZjBKdTNObnhlRlhUYXNRUHlFUFhTOHVFeTZWa2ZOTUQyVExMRUN2WXFzUkFQeHk2SVJtZE9qdVkKWDBNTzRBSkhLdnUrMStkMVBwRll5cUdCOEtzcFdvRGFLUGlDWE1JczhFZ3NaRC9nTEMvazg1YVA0ZUZ2RThCcQozTkt1dEpNVFN4NmFHVUF6dE8ranc1bnN5TVlmTnFoeDZHRUVFSlA2ZEVDaWNKM1dnSVFuWjFiZXBCYTlsY2twCnNYd1RLOWMzVlp5TE1meUNRNFk2TlhEYXY1bkJGbTIxdVFUZmN4bVdNNmovcDFDdGdvQkFSMEIrNTNBL1dRMXMKSU4xR1R1V3JKWVJFWmkzbldvRmFjTHdhclpqRWUxcFFiMi9DNndJREFRQUJBb0lCQURiaFZ3SUZBTVhOSWlkdQpqMm0zK2ZSUWpaTFUrRkJSYlNoUXU1T3Q3cGluTldjZ2x3M0t1dGxpL1dUd3paL25HWm1TSmpaZFM3cTNjZ3dsClg5U0hrYzlNS1hhbTZuRllXNkN5YjJoUFk3ZWg4Z1FkcW1VUHU4TWlwWFJWcHN3L3kzTTFEWmcyckp2b3YyRzgKa2xUNTBxWUNOSCthUGNzVmREY1IrWHc1OElwNTR2a3MwbmppSzlkdEg1Z1I3cVNTZHg3bDRFMTJiVE01ZXRXVwo5RHFsV3hNMkdzVHprZkJkZnZwMXpqblhKUWdvNFJNQ3RQMTROQ1pyZzJhalduekdHN3ZhZVRyTlBqaVU1WDBQClMzUnd3bHdET0phSk41YkdMZHI0M0hvK1FpcW16ejU5R2VJMHhrVDlwZEpXaGEvcVYwVWpQNHRGUlNjY0ROZlIKTmsxUHI3RUNnWUVBK1RDbVp6cUVRNURaeUdiVnpMTm0wY1lxY0FQOC9oTEJTdm5Qb0dDWXdNQTh4QnVIRHlmLwpGdWZsbngrRWJ0MjFCbi9ydUcxWHh5VEhndiswb3M5b1JhNE5USEorZE5VUzJweDdhOVlxbEVQRXMvYU9TT1FYCitCM3JPWHkxMWFTV0ppVEl6V1p1YWpKL1BOZ3lHalZZMi82TUJnZVhHQlhDbDhIdWNuUHYrUDhDZ1lFQXd3YmIKZkNweUJzM2h5Ym9pRVNycjVmUlM1cE9OdzFDZGJ3dHpHaGlBbVQ0MzhoRzZVZW0rOFczcEZUQjdUSVNOVU1YOApDS2M1S2k5VStFVzFUYVNYVDRCV01DU0dWM1huRFNZR21wVjZ4NG9xWGRtOU5XWGlGbXZRbjB6Nk5pQTRoYmM0Cjk3T0JodThVNmp3dTJBZ0dlNHNwbkw5WE54OTdVZkE1d3orWnFoVUNnWUFDMWlUdXcrSEJpeUtQZjJ3cm1sY3YKU0J3dmpqd1JBRkdtOHRVRU5GVkl6R2RrckJPTGZwOE91YkVKY0toblFxck8yaUhxeFlQY1JuVG03dFkxakRyWgpvRE9TalRNWFRWMmJrM0JzTjlIZ1FpMDVCek56YlBWQTQ4Wkxyem02cHRiMnREQjg5ZytIc2U5MDE5a3FKelZOCnU4WUlRNG5hd2xTbXVaUm5SUjZVTFFLQmdFQThkL3FUdUc4SlRQODJzWlhaLzAwRWhuR3YxQmVxNjgveGczM3EKNkNDUlg3ZjVvdGJzR0pwSXkyYlJTeXRPMVlUdlVTNUFkaEd3K1ZtMURCeUF3OTNKdFpteHpoWHNuYWUxQ0tQTgo3RnpnNDBkNk9sbm1MdXVYbzJWMDQwMEVtOWxmR2dKc081T0lGK2wyM1M4R3BhdjNrRU15dXJWTFIwRWIwTXJBCm5ncHBBb0dBYnBtTEhDa0N5WkFiM25qNmtEeW9DbnhEK0RacFFUcG1UOG5ZWWs4dkVQbEtTQ0c2NWNLb2poTE0KSy9uR1BOOWh5VjBlQVhoOWZ6amdDNk41NHNDQXRjOXBJd2s0bFhPenVVbVhoZ0hFa3ZlekNCWnVBMmRuZWdxZApzdXY1cnYrUS9GNUkwaDZBcnVJZnh5R01zRjVnek1Ddm0xVGs3aDBpUGZweStadHJqWlU9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0t",
                    "cert": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURoVENDQW0yZ0F3SUJBZ0lKQU5JSU9sazVxWmJRTUEwR0NTcUdTSWIzRFFFQkN3VUFNR1F4Q3pBSkJnTlYKQkFZVEFsaFlNUTB3Q3dZRFZRUUlEQVJOWVhKek1SWXdGQVlEVlFRSERBMU5iM1Z1ZENCUGJIbHRjSFZ6TVJBdwpEZ1lEVlFRS0RBZERiMjF3WVc1NU1RMHdDd1lEVlFRTERBUlZibWwwTVEwd0N3WURWUVFEREFSU1QwOVVNQjRYCkRUSXhNVEl6TURBeU1qRXhOVm9YRFRReE1USXpNREF5TWpFeE5Wb3dYVEVMTUFrR0ExVUVCaE1DV0ZneEZUQVQKQmdOVkJBY01ERVJsWm1GMWJIUWdRMmwwZVRFY01Cb0dBMVVFQ2d3VFJHVm1ZWFZzZENCRGIyMXdZVzU1SUV4MApaREVaTUJjR0ExVUVBd3dRYVc1bWJ5NWxlR0Z0Y0d4bExtTnZiVENDQVNJd0RRWUpLb1pJaHZjTkFRRUJCUUFECmdnRVBBRENDQVFvQ2dnRUJBTDNXdTRvRE9nRTIvbHZ5SmVSRDA0V3JIWlZKOUNCejJIWE1BUWhSR25BRE4zVkkKNmVZK04rTTNrbjlDYnR6WjhYaFYwMnJFRDhoRDEwdkxoTXVsWkh6VEE5a3l5eEFyMktyRVFEOGN1aUVablRvNwptRjlERHVBQ1J5cjd2dGZuZFQ2UldNcWhnZkNyS1ZxQTJpajRnbHpDTFBCSUxHUS80Q3d2NVBPV2orSGhieFBBCmF0elNyclNURTBzZW1obEFNN1R2bzhPWjdNakdIemFvY2VoaEJCQ1QrblJBb25DZDFvQ0VKMmRXM3FRV3ZaWEoKS2JGOEV5dlhOMVdjaXpIOGdrT0dPalZ3MnIrWndSWnR0YmtFMzNNWmxqT28vNmRRcllLQVFFZEFmdWR3UDFrTgpiQ0RkUms3bHF5V0VSR1l0NTFxQlduQzhHcTJZeEh0YVVHOXZ3dXNDQXdFQUFhTkJNRDh3SlFZRFZSMFJCQjR3CkhJSU5LaTVsZUdGdGNHeGxMbU52YllJTFpYaGhiWEJzWlM1amIyMHdDUVlEVlIwVEJBSXdBREFMQmdOVkhROEUKQkFNQ0JlQXdEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBRjQxbXhMOC93RGJxaTl1emxDT3VpMm5uTEdUYm1uRQo0R2l5Y3U0S1JCbjhXbUNHTDBjVVdWcU5ubnQrR1pncEd6V3JSMnZ4L2dDZTJpbUg0MUloV01GUzhNTkUwOUpUCkVQNjhXZlFYMEtFaWN5WFlaenA0RnplTTZVRHh3Q0RhaDV3Mk9JM2N3djc1RVhHUHdDd1ZmU0llcVRRY1MwRVgKWFZiY2UwSEVuUC9LaCtENFAzODgwaCtXZ3R2aXhRNXFJTHNlZC9qSytxdkxCMGx5Q3U2a1c1bGRyMTJRYkQrTQpjeERZcFgwZUsxMTIyc3JhZmRoaGhBRmxlOXFIVjRFMGROTU9ZMk1EVEhLU25HbjB1bVh5cnUwQzNoaDU0VkYwCmk4MThkeTRKUVNMekpEcGlBVVNzVnB3bzJVUjRJaUxYbTVMOEgrOEN2VkgyLzFWSmo5c2o1czQ9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURSRENDQWl3Q0NRQ0xMNHQ3MUp0MW9qQU5CZ2txaGtpRzl3MEJBUXNGQURCa01Rc3dDUVlEVlFRR0V3SlkKV0RFTk1Bc0dBMVVFQ0F3RVRXRnljekVXTUJRR0ExVUVCd3dOVFc5MWJuUWdUMng1YlhCMWN6RVFNQTRHQTFVRQpDZ3dIUTI5dGNHRnVlVEVOTUFzR0ExVUVDd3dFVlc1cGRERU5NQXNHQTFVRUF3d0VVazlQVkRBZUZ3MHlNREEyCk1URXdPVEUyTXpsYUZ3MDBNREEyTVRFd09URTJNemxhTUdReEN6QUpCZ05WQkFZVEFsaFlNUTB3Q3dZRFZRUUkKREFSTllYSnpNUll3RkFZRFZRUUhEQTFOYjNWdWRDQlBiSGx0Y0hWek1SQXdEZ1lEVlFRS0RBZERiMjF3WVc1NQpNUTB3Q3dZRFZRUUxEQVJWYm1sME1RMHdDd1lEVlFRRERBUlNUMDlVTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGCkFBT0NBUThBTUlJQkNnS0NBUUVBMGdwSzNMREZZS2liNVhaczBJbEVML016eDRXZExoaEhDUGVpWU5OS2t4S24KVmFVS0UrTS9CMUsraFRabVlMZkc1VkFPWmdrZHBXcjdwZm1QU045cVd5S05xZGVyQUh6UXU4QTRZYnhiU1NRVgpES1ZjcFFDYUhFZmpjRUtqbDB6RElYMU1LekppQXJKNFlQVENpeGdEbG5pMTk1Qm1EQncxMDBZR2EzancrRHhTCkxMbFI4VEE3eWVMdS8wTm1EVTMxLzN1NWZBVlorVnFzbmx2bitySjg3Wnpka2txNEVQUFhvanBiRElvbCtUTDEKQklXK0tOTE13WjRnOEFHbWR6ZlJQK3p0bU5xbksvTTdqK0toSzdYSTJZcHZrZGhTQ1htZHgvZ1VzNVM4eG1oUApYS2NTTEZZaFdzeGozd285WlhzbXdBamZRYVM2WmZ5NCtGN2p1bkJsRFFJREFRQUJNQTBHQ1NxR1NJYjNEUUVCCkN3VUFBNElCQVFCRHJGL2NlSFd6WHdvYkhvUExMd2krbUp4R3NTNlJPVTNRczJzaUxkQnozNzROTWZBMlN0a2UKTWo0dU9UdmN2Z3psL3lNTVZMZy9zUVhMeW8vZ0VhOVlhNFhkWDRxTmlEY0NwM3g2SjNnbWtsMGtxTzY4N3lRSgpFdW1FV1VXcmZ4Z2p4dEhSMUMvY1RFZ3FjNkYwUldHc1YrMjNkT0JvTG9RQmt2NGNUbGR5ajBGTERJZElId2p3CkFXM1B5MTJZb2JKNTRsdjhqbGZhVUVmNXg3Z3d5TW55MDR1aDRoTTVNR01WR29mK3dRWnVNNGJZMzBkVjUyNnkKQU9xeDEzY0hKek1CRW14aFdRNWdkUDNjOXdKcVVuSSswMDJPTjdiWnI5bVV0Q0Vab0JTdTQxb1Q4bGhjNG00ZApZQjJjak5wTXVSTGpjUzZHZTVyQUJweUFGWW9UVGhYdgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t"
                },
                stringData: {}
            },
            {
                metadata: {
                    name: "default-cert",
                    namespace: "apisix",
                    annotations: {},
                    labels: {}
                },
                type: "Opaque",
                data: {
                    "key": "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBdmRhN2lnTTZBVGIrVy9JbDVFUFRoYXNkbFVuMElIUFlkY3dCQ0ZFYWNBTTNkVWpwCjVqNDM0emVTZjBKdTNObnhlRlhUYXNRUHlFUFhTOHVFeTZWa2ZOTUQyVExMRUN2WXFzUkFQeHk2SVJtZE9qdVkKWDBNTzRBSkhLdnUrMStkMVBwRll5cUdCOEtzcFdvRGFLUGlDWE1JczhFZ3NaRC9nTEMvazg1YVA0ZUZ2RThCcQozTkt1dEpNVFN4NmFHVUF6dE8ranc1bnN5TVlmTnFoeDZHRUVFSlA2ZEVDaWNKM1dnSVFuWjFiZXBCYTlsY2twCnNYd1RLOWMzVlp5TE1meUNRNFk2TlhEYXY1bkJGbTIxdVFUZmN4bVdNNmovcDFDdGdvQkFSMEIrNTNBL1dRMXMKSU4xR1R1V3JKWVJFWmkzbldvRmFjTHdhclpqRWUxcFFiMi9DNndJREFRQUJBb0lCQURiaFZ3SUZBTVhOSWlkdQpqMm0zK2ZSUWpaTFUrRkJSYlNoUXU1T3Q3cGluTldjZ2x3M0t1dGxpL1dUd3paL25HWm1TSmpaZFM3cTNjZ3dsClg5U0hrYzlNS1hhbTZuRllXNkN5YjJoUFk3ZWg4Z1FkcW1VUHU4TWlwWFJWcHN3L3kzTTFEWmcyckp2b3YyRzgKa2xUNTBxWUNOSCthUGNzVmREY1IrWHc1OElwNTR2a3MwbmppSzlkdEg1Z1I3cVNTZHg3bDRFMTJiVE01ZXRXVwo5RHFsV3hNMkdzVHprZkJkZnZwMXpqblhKUWdvNFJNQ3RQMTROQ1pyZzJhalduekdHN3ZhZVRyTlBqaVU1WDBQClMzUnd3bHdET0phSk41YkdMZHI0M0hvK1FpcW16ejU5R2VJMHhrVDlwZEpXaGEvcVYwVWpQNHRGUlNjY0ROZlIKTmsxUHI3RUNnWUVBK1RDbVp6cUVRNURaeUdiVnpMTm0wY1lxY0FQOC9oTEJTdm5Qb0dDWXdNQTh4QnVIRHlmLwpGdWZsbngrRWJ0MjFCbi9ydUcxWHh5VEhndiswb3M5b1JhNE5USEorZE5VUzJweDdhOVlxbEVQRXMvYU9TT1FYCitCM3JPWHkxMWFTV0ppVEl6V1p1YWpKL1BOZ3lHalZZMi82TUJnZVhHQlhDbDhIdWNuUHYrUDhDZ1lFQXd3YmIKZkNweUJzM2h5Ym9pRVNycjVmUlM1cE9OdzFDZGJ3dHpHaGlBbVQ0MzhoRzZVZW0rOFczcEZUQjdUSVNOVU1YOApDS2M1S2k5VStFVzFUYVNYVDRCV01DU0dWM1huRFNZR21wVjZ4NG9xWGRtOU5XWGlGbXZRbjB6Nk5pQTRoYmM0Cjk3T0JodThVNmp3dTJBZ0dlNHNwbkw5WE54OTdVZkE1d3orWnFoVUNnWUFDMWlUdXcrSEJpeUtQZjJ3cm1sY3YKU0J3dmpqd1JBRkdtOHRVRU5GVkl6R2RrckJPTGZwOE91YkVKY0toblFxck8yaUhxeFlQY1JuVG03dFkxakRyWgpvRE9TalRNWFRWMmJrM0JzTjlIZ1FpMDVCek56YlBWQTQ4Wkxyem02cHRiMnREQjg5ZytIc2U5MDE5a3FKelZOCnU4WUlRNG5hd2xTbXVaUm5SUjZVTFFLQmdFQThkL3FUdUc4SlRQODJzWlhaLzAwRWhuR3YxQmVxNjgveGczM3EKNkNDUlg3ZjVvdGJzR0pwSXkyYlJTeXRPMVlUdlVTNUFkaEd3K1ZtMURCeUF3OTNKdFpteHpoWHNuYWUxQ0tQTgo3RnpnNDBkNk9sbm1MdXVYbzJWMDQwMEVtOWxmR2dKc081T0lGK2wyM1M4R3BhdjNrRU15dXJWTFIwRWIwTXJBCm5ncHBBb0dBYnBtTEhDa0N5WkFiM25qNmtEeW9DbnhEK0RacFFUcG1UOG5ZWWs4dkVQbEtTQ0c2NWNLb2poTE0KSy9uR1BOOWh5VjBlQVhoOWZ6amdDNk41NHNDQXRjOXBJd2s0bFhPenVVbVhoZ0hFa3ZlekNCWnVBMmRuZWdxZApzdXY1cnYrUS9GNUkwaDZBcnVJZnh5R01zRjVnek1Ddm0xVGs3aDBpUGZweStadHJqWlU9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0t",
                    "cert": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURoVENDQW0yZ0F3SUJBZ0lKQU5JSU9sazVxWmJRTUEwR0NTcUdTSWIzRFFFQkN3VUFNR1F4Q3pBSkJnTlYKQkFZVEFsaFlNUTB3Q3dZRFZRUUlEQVJOWVhKek1SWXdGQVlEVlFRSERBMU5iM1Z1ZENCUGJIbHRjSFZ6TVJBdwpEZ1lEVlFRS0RBZERiMjF3WVc1NU1RMHdDd1lEVlFRTERBUlZibWwwTVEwd0N3WURWUVFEREFSU1QwOVVNQjRYCkRUSXhNVEl6TURBeU1qRXhOVm9YRFRReE1USXpNREF5TWpFeE5Wb3dYVEVMTUFrR0ExVUVCaE1DV0ZneEZUQVQKQmdOVkJBY01ERVJsWm1GMWJIUWdRMmwwZVRFY01Cb0dBMVVFQ2d3VFJHVm1ZWFZzZENCRGIyMXdZVzU1SUV4MApaREVaTUJjR0ExVUVBd3dRYVc1bWJ5NWxlR0Z0Y0d4bExtTnZiVENDQVNJd0RRWUpLb1pJaHZjTkFRRUJCUUFECmdnRVBBRENDQVFvQ2dnRUJBTDNXdTRvRE9nRTIvbHZ5SmVSRDA0V3JIWlZKOUNCejJIWE1BUWhSR25BRE4zVkkKNmVZK04rTTNrbjlDYnR6WjhYaFYwMnJFRDhoRDEwdkxoTXVsWkh6VEE5a3l5eEFyMktyRVFEOGN1aUVablRvNwptRjlERHVBQ1J5cjd2dGZuZFQ2UldNcWhnZkNyS1ZxQTJpajRnbHpDTFBCSUxHUS80Q3d2NVBPV2orSGhieFBBCmF0elNyclNURTBzZW1obEFNN1R2bzhPWjdNakdIemFvY2VoaEJCQ1QrblJBb25DZDFvQ0VKMmRXM3FRV3ZaWEoKS2JGOEV5dlhOMVdjaXpIOGdrT0dPalZ3MnIrWndSWnR0YmtFMzNNWmxqT28vNmRRcllLQVFFZEFmdWR3UDFrTgpiQ0RkUms3bHF5V0VSR1l0NTFxQlduQzhHcTJZeEh0YVVHOXZ3dXNDQXdFQUFhTkJNRDh3SlFZRFZSMFJCQjR3CkhJSU5LaTVsZUdGdGNHeGxMbU52YllJTFpYaGhiWEJzWlM1amIyMHdDUVlEVlIwVEJBSXdBREFMQmdOVkhROEUKQkFNQ0JlQXdEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBRjQxbXhMOC93RGJxaTl1emxDT3VpMm5uTEdUYm1uRQo0R2l5Y3U0S1JCbjhXbUNHTDBjVVdWcU5ubnQrR1pncEd6V3JSMnZ4L2dDZTJpbUg0MUloV01GUzhNTkUwOUpUCkVQNjhXZlFYMEtFaWN5WFlaenA0RnplTTZVRHh3Q0RhaDV3Mk9JM2N3djc1RVhHUHdDd1ZmU0llcVRRY1MwRVgKWFZiY2UwSEVuUC9LaCtENFAzODgwaCtXZ3R2aXhRNXFJTHNlZC9qSytxdkxCMGx5Q3U2a1c1bGRyMTJRYkQrTQpjeERZcFgwZUsxMTIyc3JhZmRoaGhBRmxlOXFIVjRFMGROTU9ZMk1EVEhLU25HbjB1bVh5cnUwQzNoaDU0VkYwCmk4MThkeTRKUVNMekpEcGlBVVNzVnB3bzJVUjRJaUxYbTVMOEgrOEN2VkgyLzFWSmo5c2o1czQ9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0KLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURSRENDQWl3Q0NRQ0xMNHQ3MUp0MW9qQU5CZ2txaGtpRzl3MEJBUXNGQURCa01Rc3dDUVlEVlFRR0V3SlkKV0RFTk1Bc0dBMVVFQ0F3RVRXRnljekVXTUJRR0ExVUVCd3dOVFc5MWJuUWdUMng1YlhCMWN6RVFNQTRHQTFVRQpDZ3dIUTI5dGNHRnVlVEVOTUFzR0ExVUVDd3dFVlc1cGRERU5NQXNHQTFVRUF3d0VVazlQVkRBZUZ3MHlNREEyCk1URXdPVEUyTXpsYUZ3MDBNREEyTVRFd09URTJNemxhTUdReEN6QUpCZ05WQkFZVEFsaFlNUTB3Q3dZRFZRUUkKREFSTllYSnpNUll3RkFZRFZRUUhEQTFOYjNWdWRDQlBiSGx0Y0hWek1SQXdEZ1lEVlFRS0RBZERiMjF3WVc1NQpNUTB3Q3dZRFZRUUxEQVJWYm1sME1RMHdDd1lEVlFRRERBUlNUMDlVTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGCkFBT0NBUThBTUlJQkNnS0NBUUVBMGdwSzNMREZZS2liNVhaczBJbEVML016eDRXZExoaEhDUGVpWU5OS2t4S24KVmFVS0UrTS9CMUsraFRabVlMZkc1VkFPWmdrZHBXcjdwZm1QU045cVd5S05xZGVyQUh6UXU4QTRZYnhiU1NRVgpES1ZjcFFDYUhFZmpjRUtqbDB6RElYMU1LekppQXJKNFlQVENpeGdEbG5pMTk1Qm1EQncxMDBZR2EzancrRHhTCkxMbFI4VEE3eWVMdS8wTm1EVTMxLzN1NWZBVlorVnFzbmx2bitySjg3Wnpka2txNEVQUFhvanBiRElvbCtUTDEKQklXK0tOTE13WjRnOEFHbWR6ZlJQK3p0bU5xbksvTTdqK0toSzdYSTJZcHZrZGhTQ1htZHgvZ1VzNVM4eG1oUApYS2NTTEZZaFdzeGozd285WlhzbXdBamZRYVM2WmZ5NCtGN2p1bkJsRFFJREFRQUJNQTBHQ1NxR1NJYjNEUUVCCkN3VUFBNElCQVFCRHJGL2NlSFd6WHdvYkhvUExMd2krbUp4R3NTNlJPVTNRczJzaUxkQnozNzROTWZBMlN0a2UKTWo0dU9UdmN2Z3psL3lNTVZMZy9zUVhMeW8vZ0VhOVlhNFhkWDRxTmlEY0NwM3g2SjNnbWtsMGtxTzY4N3lRSgpFdW1FV1VXcmZ4Z2p4dEhSMUMvY1RFZ3FjNkYwUldHc1YrMjNkT0JvTG9RQmt2NGNUbGR5ajBGTERJZElId2p3CkFXM1B5MTJZb2JKNTRsdjhqbGZhVUVmNXg3Z3d5TW55MDR1aDRoTTVNR01WR29mK3dRWnVNNGJZMzBkVjUyNnkKQU9xeDEzY0hKek1CRW14aFdRNWdkUDNjOXdKcVVuSSswMDJPTjdiWnI5bVV0Q0Vab0JTdTQxb1Q4bGhjNG00ZApZQjJjak5wTXVSTGpjUzZHZTVyQUJweUFGWW9UVGhYdgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t"
                },
                stringData: {}
            }
        ],
        release: [
            {
                namespace: "apisix",
                name: "apisix",
                chart: "apisix",
                repositoryOpts: {
                    repo: "https://charts.apiseven.com"
                },
                version: "2.5.0",
                values: {
                    replicaCount: 1,
                    resources: {
                        limits: { cpu: "300m", memory: "1024Mi" },
                        requests: { cpu: "300m", memory: "1024Mi" }
                    },
                    nodeSelector: {},
                    timezone: "Asia/Shanghai",
                    fullnameOverride: "apisix-gateway",
                    serviceAccount: { create: true },
                    rbac: { create: true },
                    service: {
                        type: "LoadBalancer",
                        externalTrafficPolicy: "Local",
                        annotations: { "metallb.universe.tf/allow-shared-ip": "apisix-dashboard" },
                        externalIPs: ["192.168.0.101"],
                    },
                    metrics: {
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
                            labels: podlabels
                        }
                    },
                    apisix: {
                        ssl: {
                            enabled: true
                        },
                        admin: {
                            credentials: {
                                admin: config.require("adminCredentials"),
                                viewer: config.require("viewerCredentials")
                            }
                        },
                        nginx: {
                            logs: {
                                enableAccessLog: false,
                                accessLogFormat: '$remote_addr - $remote_user [$time_local] $http_host \"$request\" $status $body_bytes_sent $request_time \"$http_referer\" \"$http_user_agent\" $upstream_addr $upstream_status $upstream_response_time \"$upstream_scheme://$upstream_host$upstream_uri\"',
                                accessLogFormatEscape: "default"
                            }
                        },
                        discovery: {
                            enabled: true,
                            registry: {
                                kubernetes: {},
                                dns: { servers: ["10.96.0.10:53"] }
                            }
                        },
                        prometheus: { enabled: true },
                        plugins: ["ai", "api-breaker", "authz-casbin", "authz-casdoor", "authz-keycloak", "aws-lambda", "azure-functions", "basic-auth", "batch-requests", "body-transformer", "cas-auth", "clickhouse-logger", "client-control", "consumer-restriction", "cors", "csrf", "datadog", "degraphql", "dubbo-proxy", "echo", "elasticsearch-logger", "example-plugin", "ext-plugin-post-req", "ext-plugin-post-resp", "ext-plugin-pre-req", "fault-injection", "file-logger", "forward-auth", "google-cloud-logging", "grpc-transcode", "grpc-web", "gzip", "hmac-auth", "http-logger", "inspect", "ip-restriction", "jwt-auth", "kafka-logger", "kafka-proxy", "key-auth", "ldap-auth", "limit-conn", "limit-count", "limit-req", "loggly", "log-rotate", "mocking", "node-status", "opa", "openfunction", "openid-connect", "opentelemetry", "openwhisk", "prometheus", "proxy-cache", "proxy-control", "proxy-mirror", "proxy-rewrite", "public-api", "real-ip", "redirect", "referer-restriction", "request-id", "request-validation", "response-rewrite", "rocketmq-logger", "server-info", "serverless-post-function", "serverless-pre-function", "skywalking", "skywalking-logger", "sls-logger", "splunk-hec-logging", "syslog", "tcp-logger", "tencent-cloud-cls", "traffic-split", "ua-restriction", "udp-logger", "uri-blocker", "wolf-rbac", "workflow", "zipkin"],
                        pluginAttrs: {
                            skywalking: {
                                service_name: "demo::APISIX",
                                service_instance_name: "$hostname",
                                "endpoint_addr": "http://skywalking-oap.skywalking:12800",
                                report_interval: 15
                            }
                        }
                    },
                    externalEtcd: {
                        host: ["http://apisix-etcd-headless:2379"],
                        user: "root",
                        password: config.require("etcdPassword")
                    },
                    etcd: { enabled: false },
                    dashboard: {
                        enabled: true,
                        replicaCount: 1,
                        labelsOverride: podlabels,
                        config: {
                            conf: {
                                etcd: {
                                    endpoints: ["http://apisix-etcd-headless:2379"],
                                    username: "root",
                                    password: config.require("etcdPassword")
                                },
                                log: {
                                    errorLog: {
                                        level: "warn"
                                    },
                                    accessLog: {
                                        level: "warn"
                                    }
                                }
                            },
                            authentication: {
                                users: [
                                    {
                                        username: "admin",
                                        password: config.require("dashboardPassword")
                                    }
                                ]
                            }
                        },
                        ingress: {
                            enabled: true,
                            className: "nginx",
                            annotations: {},
                            hosts: [
                                {
                                    host: "apisix.example.com",
                                    paths: ["/"]
                                }
                            ]
                        },
                        resources: {
                            limits: { cpu: "300m", memory: "128Mi" },
                            requests: { cpu: "300m", memory: "128Mi" }
                        },
                        nodeSelector: {}
                    },
                    "ingress-controller": { enabled: false }
                }
            },
            {
                namespace: "apisix",
                name: "apisix-ingress-controller",
                chart: "apisix-ingress-controller",
                repositoryOpts: {
                    repo: "https://charts.apiseven.com"
                },
                version: "0.13.0",
                values: {
                    replicaCount: 1,
                    config: {
                        logLevel: "error",
                        apisix: {
                            serviceName: "apisix-gateway-admin",
                            serviceNamespace: "apisix",
                            adminKey: config.require("adminCredentials"),
                            adminAPIVersion: "v3"
                        }
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "128Mi" },
                        requests: { cpu: "100m", memory: "128Mi" }
                    },
                    initContainer: {
                        image: "registry.cn-shanghai.aliyuncs.com/goldenimage/busybox",
                        tag: "1.36"
                    },
                    nodeSelector: {},
                    serviceMonitor: {
                        enabled: true,
                        interval: "60s",
                        labels: podlabels
                    }

                }
            },
            {
                namespace: "apisix",
                name: "etcd",
                chart: "etcd",
                repositoryOpts: {
                    repo: "https://charts.bitnami.com/bitnami"
                },
                version: "9.8.0",
                values: {
                    fullnameOverride: "apisix-etcd",
                    auth: {
                        rbac: {
                            create: true,
                            allowNoneAuthentication: true,
                            rootPassword: config.require("etcdPassword")
                        }
                    },
                    autoCompactionMode: "periodic",
                    autoCompactionRetention: "1h",
                    initialClusterState: "new",
                    logLevel: "error",
                    extraEnvVars: [
                        { name: "ETCD_QUOTA_BACKEND_BYTES", value: "4294967296" }
                    ],
                    replicaCount: 1,
                    resources: {
                        limits: { cpu: "500m", memory: "1024Mi" },
                        requests: { cpu: "500m", memory: "1024Mi" }
                    },
                    podLabels: podlabels,
                    persistence: {
                        enabled: true,
                        storageClass: "vsphere-san-sc",
                        size: "7Gi"
                    },
                    volumePermissions: {
                        enabled: true,
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    },
                    metrics: {
                        enabled: true,
                        podMonitor: {
                            enabled: true,
                            interval: "60s",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        },
                        prometheusRule: {
                            enabled: false,
                            rules: []
                        }
                    }
                }
            }
        ],
        customresource: [
            /**
            {
                apiVersion: "networking.k8s.io/v1",
                kind: "IngressClass",
                metadata: {
                    name: "apisix",
                    annotations: {},
                    labels: {}
                },
                spec: {
                    controller: "apisix.apache.org/ingress-controller"
                }
            },
             */
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "apisix-gateway",
                    namespace: "apisix"
                },
                spec: {
                    podMetricsEndpoints: [
                        {
                            interval: "60s",
                            scrapeTimeout: "30s",
                            path: "/apisix/prometheus/metrics",
                            scheme: "http",
                            targetPort: "prometheus",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { action: "replace", replacement: "demo", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "dev", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "API-Gateway", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "apisix", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "dc01", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["apisix"]
                    },
                    selector: {
                        matchLabels: {
                            "app.kubernetes.io/instance": "apisix",
                            "app.kubernetes.io/name": "apisix"
                        }
                    }
                }
            },
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "apisix-ingress-controller",
                    namespace: "apisix"
                },
                spec: {
                    podMetricsEndpoints: [
                        {
                            interval: "60s",
                            scrapeTimeout: "30s",
                            path: "/metrics",
                            scheme: "http",
                            targetPort: "http",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { action: "replace", replacement: "demo", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "dev", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "API-Gateway", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "apisix", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "dc01", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["apisix"]
                    },
                    selector: {
                        matchLabels: {
                            "app.kubernetes.io/instance": "apisix-ingress-controller",
                            "app.kubernetes.io/name": "apisix-ingress-controller"
                        }
                    }
                }
            },
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixClusterConfig",
                metadata: {
                    name: "default"
                },
                spec: {
                    monitoring: {
                        skywalking: {
                            enable: true,
                            sampleRatio: 1
                        },
                        prometheus: {
                            enable: true,
                            prefer_name: true
                        }
                    }
                }
            },
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixTls",
                metadata: {
                    name: "default-cert",
                    namespace: "apisix"
                },
                spec: {
                    hosts: ["*.example.com", "example.com"],
                    secret: {
                        name: "default-cert",
                        namespace: "apisix"
                    }
                }
            },
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixGlobalRule",
                metadata: {
                    name: "default",
                    namespace: "apisix"
                },
                spec: {
                    plugins: [
                        {
                            name: "udp-logger",
                            enable: true,
                            config: {
                                host: "apisix-udp-vector.datadog",
                                port: 1514,
                                batch_max_size: 1,
                                name: "udp logger",
                                log_format: {
                                    "@timestamp": "$time_iso8601",
                                    "upstream_response_time": "$upstream_response_time",
                                    "upstream_header_time": "$upstream_header_time",
                                    "upstream_connect_time": "$upstream_connect_time",
                                    "route_name": "$route_name",
                                    "remote_addr": "$remote_addr",
                                    "body_bytes_sent": "$body_bytes_sent",
                                    "host": "$host",
                                    "http_referer": "$http_referer",
                                    "http_user_agent": "$http_user_agent",
                                    "request_uri": "$request_uri",
                                    "request_length": "$request_length",
                                    "request_method": "$request_method",
                                    "request_time": "$request_time",
                                    "status": "$status",
                                    "scheme": "$scheme",
                                    "server_port": "$server_port",
                                    "server_protocol": "$server_protocol",
                                    "ssl_cipher": "$ssl_cipher",
                                    "ssl_protocol": "$ssl_protocol",
                                    "upstream_addr": "$upstream_addr"
                                }
                            }
                        },
                        {
                            name: "skywalking-logger",
                            enable: true,
                            config: {
                                endpoint_addr: "http://skywalking-oap.skywalking:12800",
                                service_name: "demo::APISIX",
                                service_instance_name: "$hostname"
                            }
                        },
                        {
                            name: "real-ip",
                            enable: true,
                            config: {
                                source: "http_x_forwarded_for",
                                trusted_addresses: ["127.0.0.0/24", "10.0.0.0/8"],
                                recursive: true
                            }
                        },
                        {
                            name: "redirect",
                            enable: true,
                            config: {
                                http_to_https: true
                            }
                        }
                    ]
                }
            }
        ]
    }
]

const namespace = new k8s_module.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s_module.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s_module.helm.v3.Release('Release', { resources: resources }, { dependsOn: [secret] });
const customresource = new k8s_module.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [release] });