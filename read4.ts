import {httpPost} from "./utils/http";

import * as  fs from 'fs';
import csv from 'csv-parser';
import * as fastcsv from 'fast-csv';
import {from, Observable} from "rxjs";
import {map, mergeMap, toArray} from "rxjs/operators";
import * as _ from 'lodash';
import {indexOf} from "lodash";

const results: string[] = [];


function getUserState(addresses: string[]): Observable<any[]> {
    const url: string = 'https://localhost:8000/v1/task/state';

    return httpPost(url, {
        addresses: addresses
    }).pipe(
        map((res) => {
            return res.body.users as any[]
        })
    )

}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// fs.createReadStream('./address2.csv') // 替换为你的 CSV 文件路径
//     .pipe(csv())
//     .on('data', (data: any) => {
//         if (data.address) {
//             results.push(data.address);
//         }
//     })
//     .on('end', () => {
//         const groups: string[][] = _.chunk(results, 100)
//
//         console.log('groups', groups);
//
//         from(groups).pipe(
//             mergeMap((group: string[]) => {
//                 return getUserState(group);
//             }),
//             toArray(),
//             map((res: any[][]) => {
//                 console.log('res', res[0]);
//                 return res.flat()
//             }),
//             map((users) => {
//                 console.log(users.length);
//
//                 const fUsers = users.filter(one => !one);
//
//                 console.log(fUsers);
//
//                 const done = users.filter(one => one.bridge && one.hold)
//                 const addresses = done.map(one => one.user);
//                 const ws = fs.createWriteStream('output2.csv');
//
//                 fastcsv
//                     .write(addresses.map(address => ({address})), {headers: true})
//                     .pipe(ws)
//                     .on('finish', () => {
//                         console.log('Write to CSV successfully!');
//                     })
//                     .on('error', err => {
//                         console.error(err);
//                     });
//             })
//         ).subscribe()
//
//     });
//


getUserState(['0x33dc3a6eaa1c83ce67dc360bc385ba6d4c0db7ef']).subscribe(res => {
    console.log(res);
})