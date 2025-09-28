import {httpPost} from "../utils/http";
import {delay, expand, last, map} from "rxjs/operators";
import {AsyncSubject, BehaviorSubject, EMPTY, Observable, zip} from "rxjs";
import fs from "fs";
import * as fastcsv from "fast-csv";
import csv from "csv-parser";
import * as _ from 'lodash';

const url: string = 'https://api.studio.thegraph.com/query/70107/scroll-nuri-holders/version/latest';
const url3: string = 'https://gateway.thegraph.com/api/7bee97bc562cdb0319003139011b2d6b/subgraphs/id/25CmGwC7ajXnspoHbAadjvB8NZnWxgaSDgXq9HY9WmGP';

// -----------------------------------------------

function fetchIds(url: string): Observable<{ holders: { id: string }[] }> {
    return fetchIdOne(url, '0x00').pipe(
        expand(({holders: oldHolders, next: oldNext, last: oldLast}) => {
            if (!oldNext) {
                return EMPTY;
            }


            return fetchIdOne(url, oldLast).pipe(map(({holders, next, last}) => {
                return {holders: [...oldHolders, ...holders], next, last};
            }));
        })
    )
}

function fetchIdOne(url: string, last: string): Observable<{ holders: { id: string }[], next: boolean, last: string }> {
    const param = genId(last);

    return httpPost(url, param).pipe(
        delay(1000),
        map((res) => {
            if (res.status !== 200) {
                return [];
            }

            if (!res.body.data?.positionHolders) {
                console.log(res.body);
            }

            const holders: { id: string }[] = res.body.data.positionHolders;

            return holders;
        }),
        map((holders: { id: string }[]) => {
            console.log('ids holders', holders.length);
            if (holders.length > 0) {
                return {holders, next: holders.length === 1000, last: holders[holders.length - 1].id};
            } else {
                return {holders, next: false, last: '0xffffffffffffffffffffffffffffffffffffffff'};
            }
        })
    )
}

function genId(last: string): any {
    return {
        query: `{
            positionHolders(
                orderBy: id, 
                orderDirection: asc,
                first: 1000,
                where: {
                    id_gt: "${last}"
                }
            ) {
                id
              }
        }`,
    }
}

function writeToIds(file: string, data: { id: string }[]) {
    const ws = fs.createWriteStream(file);
    fastcsv
        .write(data.map(row => ({id: row.id})), {headers: true})
        .pipe(ws)
        .on('finish', () => {
            console.log('Write to CSV successfully!', file);
        })
        .on('error', err => {
            console.error(err);
        });
}


// ------------------------------------------------

function fetchIdx(url: string): Observable<{ holders: { id: string, idx: number }[] }> {
    return fetchIdxOne(url, 0).pipe(
        expand(({holders: oldHolders, next: oldNext, offset: oldOffset}) => {
            if (!oldNext) {
                return EMPTY;
            }

            return fetchIdxOne(url, oldOffset).pipe(map(({holders, next, offset}) => {
                return {holders: [...oldHolders, ...holders], next, offset: oldOffset + offset}
            }))
        })
    )
}

function fetchIdxOne(url: string, offset: number): Observable<{
    holders: { id: string, idx: number }[],
    next: boolean,
    offset: number
}> {
    const param = genIdx(offset);

    return httpPost(url, param).pipe(
        delay(1000),
        map(res => {
            if (res.status !== 200) {
                return [];
            }

            if (!res.body.data?.positionHolders) {
                console.log(res.body);
            }

            const holders: { id: string, idx: number }[] = res.body.data.positionHolders;

            console.log('idx holders', holders.length);

            return holders;
        }),
        map((holders: { id: string, idx: number }[]) => {
            if (holders.length > 0) {
                return {holders, next: holders.length === 1000, offset: holders.length};
            } else {
                return {holders, next: false, offset: 999999999};
            }
        })
    )
}

function genIdx(offset: number): any {
    return {
        query: `{
            positionHolders(
                where: {
                    idx_gt: ${offset}
                },
                first: 1000,
                orderBy: idx,
                orderDirection: asc
            ){
                id,
                idx
            }
        }`
    }
}

function writeToIdx(file: string, data: { id: string, idx: number }[]) {
    const ws = fs.createWriteStream(file);
    fastcsv
        .write(data.map(row => ({idx: row.idx, id: row.id})), {headers: true})
        .pipe(ws)
        .on('finish', () => {
            console.log('Write to CSV successfully!', file);
        })
        .on('error', err => {
            console.error(err);
        });
}

const fileIdx: string = './tasks/holders/holders_idx.cvs';
const fileIds: string = './tasks/holders/holders_ids.cvs';

// -----------------------------------------------
// idx
// fetchIdx(url).pipe(last()).subscribe({
//     next: (data: { holders: { id: string, idx: number }[] }) => {
//         writeToIdx('./tasks/holders/holders_idx.cvs', data.holders);
//     }
// });

// ids
// fetchIds(url3).pipe(last()).subscribe({
//     next: (rs) => {
//         writeToIds('./tasks/holders/holders_ids.cvs', rs.holders);
//     }
// })

// -----------------------------------------------

const idx: string[] = [];
const ids: string[] = [];

const idxSub = new AsyncSubject<string[]>();
const idsSub = new AsyncSubject<string[]>();

fs.createReadStream(fileIdx).pipe(csv())
    .on('data', (data: any) => {
        if (data.id) {
            idx.push(data.id);
        }
    })
    .on('end', () => {
        idxSub.next(idx);
        idxSub.complete();
    });

fs.createReadStream(fileIds).pipe(csv())
    .on('data', (data: any) => {
        if (data.id) {
            ids.push(data.id)
        }
    })
    .on('end', () => {
        idsSub.next(ids);
        idsSub.complete();
    });

zip(idxSub, idsSub)
    .pipe(map(([idx, ids]) => {
        const dxds: string[] = _.difference(idx, ids);
        const dsdx: string[] = _.difference(ids, idx);

        return {dxds, dsdx};
    }))
    .subscribe({
        next: ({dxds, dsdx}) => {
            console.log(dxds);
            console.log(dsdx);
        }
    })