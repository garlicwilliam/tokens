import crypto from 'crypto';
import {httpGet} from "./utils/http";
import {of, tap} from "rxjs";
import {catchError} from "rxjs/operators";

const privateKey = "MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAJtaheRtvB9xmctbjdWyHVgy7Vblrit4ge9" +
    "wxioWNYmXiG4Dskpl0L87emYSrF1IZk+R6sOg3vTJ8VQ8nAocX5lzfQJZIdOA36K9HVbgTDJB3jxvtZ91To1U27anSn0HZ29zK2x0hn4" +
    "UqMPCNemXDbX//3NfvEuvasX5h4/WanbRAgMBAAECgYBhrrGxyC4Zt1x0ucSdMbmx05PYp+K0ArnwzIBNxlkzgsyOIFTi4tI27DcyJ1up6/" +
    "Qo5B8xkt2eHbxYsyOKV/zjjNo7afmQ/woBPgCxuErNJsdo2g0nH0k8A4Pw0FcLQL4sQocyfYsFMNhP56SY5fkgRAdAYPJ5v5RG47dLVoMGY" +
    "QJBANF69BOAa/V+wubh5d5+l04zDkt/xMq7AoeHbeABpEOAEVwEfYqrH2H/BreUod8LixC6CR1KZZ9s+nnSGd9kz+sCQQC92nGk32kU09Oc" +
    "XtQzRn1Fi2AHvsSShQ8rwf40Buxl0IZK6sQkkSb2Eg1bA+E5KfAbzfX2YziAH/KcsdaxZ2EzAkEAwlK3tpuMCplDviBSOBrgyzcLjLgC2zm" +
    "t+AGGyKVdNwzHjb/QoeFqZGLKXWRw4NL5d1PMfrJ0IPdcR8PCInyHbwJAT2CqzT1fiQa73hBD9qBNNit83iAjvgMGAcydRRFz+2nBDEe19Hf" +
    "/6zhG/zvTCfx/2JA3e2mmsOMqo9szIX9QwwJAVfTewPB76mTwrTDbvBXAAXRU1WKpmrDiKHCViRO8Z6iP/KwwQxqpGiZTXr6zN8onidVjRzW" +
    "JHGcWq3cCGO0v9w==";

export function genPrivateKey(keyString: string): string {
    return '-----BEGIN PRIVATE KEY-----\n' + keyString + '\n-----END PRIVATE KEY-----';
}

const data: any = {
    "walletAddress": "0xf5aa47def3a3afedafbe4b0c0dc6eb833cf7e64e",
    "task": '["bridge","hold"]',
    "recvWindow": 3000,
    "timestamp": new Date().getTime()
}

const dataStr: string = Object.keys(data).map((key: string) => {
    return key + '=' + data[key].toString();
}).join('&');

const sign = crypto.createSign('RSA-SHA256');
sign.update(dataStr);
const signature: string = sign.sign(genPrivateKey(privateKey), 'base64');

console.log('data:', dataStr);
console.log('signature:', signature);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
httpGet('https://localhost:8000/v1/task/completion', data, {header: {"signature": signature}}).pipe(
    tap((res) => {
        console.log(res.body);
    }),
    catchError(err => {
        return of(false)
    })
).subscribe();