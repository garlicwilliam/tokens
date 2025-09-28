import * as  fs from 'fs';
import csv from 'csv-parser';
import * as fastcsv from 'fast-csv';
import {AsyncSubject, BehaviorSubject, from, Observable, switchMap, zip} from "rxjs";
import {map, mergeMap, toArray} from "rxjs/operators";
import * as _ from 'lodash';
import {httpPost} from "./utils/http";

const results: string[] = [];
const outputs: string[] = [];

const addressSub: AsyncSubject<string[]> = new AsyncSubject<string[]>();
const outputsSub: AsyncSubject<string[]> = new AsyncSubject<string[]>();

fs.createReadStream('./address2.csv').pipe(csv())
    .on('data', (data: any) => {
        if (data.address) {
            results.push(data.address);
        }
    })
    .on('end', () => {
        addressSub.next(results)
        addressSub.complete();
    });

fs.createReadStream('./output2.csv').pipe(csv())
    .on('data', (data: any) => {
        if (data.address) {
            outputs.push(data.address);
        }
    })
    .on('end', () => {
        outputsSub.next(outputs);
        outputsSub.complete();
    });


zip(addressSub, outputsSub).pipe(
    map(([addressArr, outputsArr]) => {
        return _.difference(addressArr, outputsArr)
    })
).subscribe(diff => {
    console.log('diff', diff.length);
    getUsers(diff).subscribe(res => {
        const users = (res.users as any[]).map(one => one.id)


        const notExist = _.difference(diff, users)
        console.log('not', notExist.length);
        console.log(notExist);

        const ws = fs.createWriteStream('diff2.csv');
        fastcsv
            .write(notExist.map(address => ({address})), {headers: true})
            .pipe(ws)
            .on('finish', () => {
                console.log('Write to CSV successfully!');
            })
            .on('error', err => {
                console.error(err);
            });
    })

})

function getUsers(address: string[]) {

    const url: string = 'https://api.studio.thegraph.com/query/70107/binance-wallet-prod/version/latest';
    const userStr = address.map(one => `"${one}"`).join(',');
    const param = {
        query: `{
            users(first: 1000, where: {id_in: [${userStr}]}) {
                id,
                effectiveBridge
                isBridgeDone
            }
        }`
    }

    return httpPost(url, param).pipe(
        map((res) => {
            return res.body.data
        })
    )
}
