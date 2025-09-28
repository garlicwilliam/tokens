import {Observable} from "rxjs";
import {httpPost} from "../utils/http";
import {catchError, map} from "rxjs/operators";

export function querySubAddresses(refAddresses: string[]): Observable<string[]> {
    const url: string = 'https://points.stakestone.io/data/referrals';

    return httpPost(url, {inviterAddresses: refAddresses} , {throwErr: true,header: {'admin-token': 'A!@#1234'}}).pipe(
        map(res => {

            return res.body.addresses
        })
    )
}

