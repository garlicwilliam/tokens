import {from, mergeMap, Observable, tap} from "rxjs";
import fs from "fs";
import csv from "csv-parser";
import {httpPost} from "./utils/http";
import {map, toArray} from "rxjs/operators";
import * as _ from 'lodash';
import * as fastcsv from "fast-csv";


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const addresses: string[] = [];
const task1 = [];
const task2 = [];

fs.createReadStream('./address.csv').pipe(csv())
    .on('data', (data: any) => {
        if (data.address) {
            addresses.push(data.address);
        }
    })
    .on('end', () => {

        const groups: string[][] = _.chunk(addresses, 100);

        from(groups).pipe(
            mergeMap((userGroup: string[]) => {
                return getUserState(userGroup)
            }),
            toArray(),
            map((users: any[][]) => {
                return users.flat()
            }),
            map((users) => {
                const userAddress: string[] = users.map(one => one.user);
                const doneUsers: string[] = users.filter((one: any) => one.bridge).map(one => one.user);
                const holdUsers: string[] = users.filter((one: any) => one.hold).map(one => one.user);

                const diff2: string[] = _.difference(addresses, userAddress)

                writeTo('exist1.cvs', userAddress);
                writeTo('non_exist1.cvs', diff2);
                writeTo('done1.cvs', doneUsers);
                writeTo('hold1.cvs', holdUsers);


                console.log(addresses.length);
                console.log(userAddress.length);
                console.log(doneUsers.length);
                console.log(holdUsers.length);


                const task2Addresses = addresses.map(one => {
                    const task2Done = holdUsers.indexOf(one) >= 0
                    return {address: one, done: task2Done}
                })

                writeTo2('task2.cvs', task2Addresses);
            })
        ).subscribe()
    });


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


function getUserState(addresses: string[]): Observable<any[]> {
    const url: string = 'https://localhost:8000/v1/task/state';

    return httpPost(url, {
        addresses: addresses
    }).pipe(
        map((res) => {
            return (res.body.users || []) as any[]
        })
    )
}


function writeTo(file: string, data: string[]) {
    const ws = fs.createWriteStream(file);
    fastcsv
        .write(data.map(address => ({address})), {headers: true})
        .pipe(ws)
        .on('finish', () => {
            console.log('Write to CSV successfully!');
        })
        .on('error', err => {
            console.error(err);
        });
}


function writeTo2(file: string, data: { address: string; done: boolean }[]) {
    const ws = fs.createWriteStream(file);
    fastcsv
        .write(data.map(address => (address)), {headers: true})
        .pipe(ws)
        .on('finish', () => {
            console.log('Write2 to CSV successfully!');
        })
        .on('error', err => {
            console.error(err);
        });
}
