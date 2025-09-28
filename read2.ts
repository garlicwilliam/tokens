import {httpGet, httpPost} from "./utils/http";
import {catchError, delay, expand, last, map, mergeMap, toArray} from "rxjs/operators";
import {EMPTY, from, Observable, of, zip} from "rxjs";
import {SldDecimal} from "./utils/decimal";
import {isSameAddress} from "./utils/address";


function doGet2(): Observable<SldDecimal> {
    const address: string = '0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982'; //'0x9683b75853394B4D664256Fdba643D651926c857';//
    const url: string = `https://app.eigenlayer.xyz/api/trpc/tokenStaking.getRestakingPoints?batch=1&input={"0":{"json":{"staker":"${address}"}}}`;

    return httpGet(url).pipe(
        map(res => {
            const shares = res.body[0];

            const all: any[] = shares.result.data.json;
            const myShare: bigint = all
                .filter(one => isSameAddress(one.strategyAddress, '0x93c4b944d05dfe6df7645a86cd2206016c51564d'))
                .map(one => BigInt(one.integratedShares))
                .reduce((acc, cur) => {
                    return acc + cur;
                }, 0n);


            const p = SldDecimal.fromOrigin(myShare / 3660n, 18);

            console.log('p primary', myShare);
            console.log('p points', p.format({fix: 5}));

            return p;
        })
    );
}

doGet2().subscribe(rs => {
    console.log(rs.format({fix: 5}));
})

