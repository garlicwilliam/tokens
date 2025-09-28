import {httpGet, httpPost} from "../utils/http";
import {expand, last, map} from "rxjs/operators";
import {SldDecimal} from "../utils/decimal";
import {EMPTY, Observable} from "rxjs";
import fs from "fs";
import * as fastcsv from "fast-csv";

type User = {
    taskDoneIdx: number;
    id: string;
    taskDone: boolean;
    taskDoneBlock: number;
    taskDoneTimestamp: string;
    totalEth: SldDecimal;
    totalShares: SldDecimal;
}

const graphUrl: string = 'https://gateway.thegraph.com/api/7bee97bc562cdb0319003139011b2d6b/subgraphs/id/AMM8RcAXWY7fb8f8zbRU2YNjdkzBuGBTN7T2eBzo4Lg2';


function execute(): Observable<User[]> {
    return query(0).pipe(
        expand((users: User[]) => {
            if (users.length >= 10100) {
                return EMPTY
            }

            return query(users.length).pipe(map((newUsers) => [...users, ...newUsers]));
        }),
        last(),
    )
}

function query(offset: number): Observable<User[]> {
    console.log('do query', offset);

    return httpPost(graphUrl, genParam(offset)).pipe(
        map((res) => {
            if (res.status !== 200) {
                throw Error(`Graph request failed: ${res.status}`);
            }

            if (!res.body.data) {
                console.log('ERROR BODY', res.body);
                throw Error('Graph response data error');
            }

            return res.body.data.beraStoneDepositUsers;
        }),
        map((users) => {
            return users.map((user: any) => {
                return {
                    taskDoneIdx: user.taskDoneIdx,
                    id: user.id,
                    taskDone: user.taskDone,
                    taskDoneBlock: user.taskDoneBlock,
                    totalEth: SldDecimal.fromOrigin(BigInt(user.totalEth), 18),
                    totalShares: SldDecimal.fromOrigin(BigInt(user.totalShares), 18),
                    taskDoneTimestamp: user.taskDoneTimestamp
                }
            })
        })
    )
}

function genParam(offset: number): any {

    return {
        query: `{
            beraStoneDepositUsers(
                where: { taskDoneIdx_gt: ${offset} },
                first: 1000,
                where: { taskDone: true },
                orderBy: taskDoneIdx,
                orderDirection: asc
            ) {
                taskDoneIdx
                taskDone
                taskDoneBlock
                taskDoneTimestamp
                totalEth
                totalShares
                id
            }
        }`
    }

}

function writeTo(users: User[], file: string) {

    const rows = users.map(one => {
        return {
            taskDoneIdx: one.taskDoneIdx,
            id: one.id,
            taskDone: one.taskDone,
            taskDoneBlock: one.taskDoneBlock,
            taskDoneTimestamp: new Date(Number(one.taskDoneTimestamp) * 1000).toJSON(),
            totalEth: one.totalEth.format({fix: 6, removeZero: false, split: false}),
            totalShares: one.totalShares.format({fix: 6, removeZero: false, split: false})
        }
    })

    const ws = fs.createWriteStream(file);
    fastcsv.write(rows, {headers: true})
        .pipe(ws)
        .on('finish', () => {
            console.log('Write to CSV successfully!', file);
        })
        .on('error', err => {
            console.error(err);
        });
}


execute().subscribe((users) => {
    writeTo(users, './data/bera_10000/bera_10000_users.csv');
})