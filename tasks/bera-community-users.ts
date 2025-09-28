import {querySubAddresses} from "./query-address";
import {httpPost} from "../utils/http";
import {concatMap, delay, map, switchMap} from "rxjs/operators";
import {AsyncSubject, EMPTY, from, Observable} from "rxjs";
import fs from "fs";
import * as fastcsv from "fast-csv";
import {SldDecimal} from "../utils/decimal";


const list = [
    {address: '0x40495a781095932e2fc8dcca69f5e358711fdd41', code: 'THJ69'},
    {address: '0x8a6f6f31604bf33631db87be385ff29d2afe856a', code: 'BRUUV'},
    {address: '0xc73a9b3622bee5f8a0be285ede86b78d6b514578', code: 'TEDDY'},
    {address: '0x248be5328116fe9d940e492b60c771486dff8d49', code: 'PANDA'},
    {address: '0x7e5b8b5c34d1b403dd9b0ba9f488e671b4fe47f9', code: 'INFRA'},
    {address: '0x52256ef863a713ef349ae6e97a7e8f35785145de', code: 'DOLO6'},
    {address: '0xf407e15fbd0b3a6a579fddcb1e598ee6122248ac', code: 'NECT2'},
    {address: '0x6c870264520b2e59d24ae42bcb61f13d32f1ab78', code: 'DROME'},
    {address: '0x3d4820a615d909dfa6c8883d5872d05a32c4df55', code: 'GUN20'},
    {address: '0x5e40d824541014939dc6cfc89e1f6e4fd606acdc', code: 'PEMBY'},
    {address: '0x3735029b5edfa035f087c1d7044cac4382444ddb', code: 'RAMEN'},
    {address: '0x0670963edddfcee92b475eb0e1a9e087204b3261', code: 'HPOSI'},
    {address: '0x72fdfed0d55a02eacea68ce6bb7c577a3db5e99f', code: 'NARRA'},
    {address: '0x507593b40126720f889dd8d02c3c9833ac49564b', code: 'CAVED'},
    {address: '0x001fd59051346524ace633927b9c2d9e82bdc4e8', code: 'TAROT'},
    {address: '0x6fe857dd9b0a23043fe8feddf21838127188a19d', code: 'HONEY'},
    {address: '0xfa537a7f06d9a0c25269f993b3b77ede06557a49', code: 'BLAND'},
    {address: '0x09a7218fb70969f31c15c31ed1c2d2b67947bf3a', code: 'PUFFF'},
    {address: '0x1042af70e746eed433946b323ccead16d91a11cd', code: 'BOKER'},
    {address: '0x4787f22e8f8cb0c11ba0e7985fae165703d70900', code: 'TABIZ'},
    {address: '0x590a684b62d9533a72e352e3f6a2d92dc91a7c8a', code: 'WIZZW'},
    {address: '0xf87498cfe78dd732043cf7db54d7562096869ac6', code: 'DTOWN'},
    {address: '0x0e41dc1798e09e7ada1996979a5935f47a2b4f10', code: 'BHOME'},
    {address: '0x6f6c5aa362acd2dbae44fa39c03d1110a9d46e5c', code: 'HOLDW'},
    {address: '0x3a75e7d51138f0effb6c833cb94b9b418d58349e', code: 'TTTVN'},
    {address: '0x27daeace9370b53f38073474ae44e04f1777331c', code: 'BCDAO'},
    {address: '0x4c8a762d217b56b978ba50363322542f49850d9e', code: 'YEET1'},
    {address: '0xb5047edfaaec7ab07bc8da649ddd02ed8766b3ac', code: 'WEB3D'},
    {address: '0xb8eee1d2305ee1061b96b2e97c62facf8e939235', code: 'BEFAM'},
    {address: '0xbe150a8769af1ee12c15080b8440e0e461df528f', code: 'WWLKR'},
    {address: '0x81168c14e5a89f60b30e9a7f82a229406a64369d', code: 'KBERA'},
    {address: '0xaea0e1848b05ca387b19956de388b6d14b44d674', code: 'A2ZEX'},
    {address: '0x1d9530fa66d5332b7e987e5ee33aa3012ea8a637', code: 'DEFIM'},
    {address: '0x2466887c5ab22f4a19828bff94ab5cdae7186ea9', code: 'HPOTF'}
]

type UserTaskInfo = {
    id: string;
    taskDone: boolean;
    taskDoneIdx: number;
    taskDoneBlock: string;
    taskDoneTimestamp: string;
    eth: string;
    btc: string;
}

type RowInfo = {
    no: number;
    address: string;
    taskIndex: number;
    taskFinished: boolean;
    taskFinishBlock: string;
    taskFinishTime: string;
    eth: string;
    btc: string;
}

let totalCounter = 0;

function convertRow(task: UserTaskInfo, index: number): RowInfo {
    if (task.taskDone) {
        totalCounter++;
    }

    return {
        no: index + 1,
        address: task.id,
        taskIndex: task.taskDoneIdx,
        taskFinished: task.taskDone,
        taskFinishBlock: task.taskDone ? task.taskDoneBlock : '',
        taskFinishTime: task.taskDone ? new Date(Number(task.taskDoneTimestamp) * 1000).toJSON() : '',
        eth: SldDecimal.fromOrigin(BigInt(task.eth), 18).format({fix: 6, removeZero: true, split: false}),
        btc: SldDecimal.fromOrigin(BigInt(task.btc), 18).format({fix: 6, removeZero: true, split: false})
    }
}

function getReferralUsers(address: string, code: string): Observable<boolean> {
    const rs = new AsyncSubject<boolean>();
    querySubAddresses([address]).pipe(
        switchMap((users: string[]) => {
            console.log(code + ' Users: ', users.length);
            return getUserTaskInfo(users)
        }),
        map((taskUsers) => {
            return taskUsers.sort((a, b) => a.taskDoneIdx - b.taskDoneIdx)
        }),
        map((taskUsers) => {
            return taskUsers.map((user, index) => convertRow(user, index))
        })
    ).subscribe({
        next: (infoArr) => {
            if (infoArr) {
                writeTo2(`./data/bera/bera_${code}.csv`, infoArr, rs);
            }
        }
    })

    return rs;
}

function getUserTaskInfo(users: string[]): Observable<UserTaskInfo[]> {
    const userStr = users.map(one => `"${one}"`).join(',');
    const param = {
        query: `{
                  depositUsers(
                    first: 1000, where: {id_in: [${userStr}]}
                  ) {
                    idx
                    id
                    taskDone
                    taskDoneIdx
                    taskDoneBlock
                    taskDoneTimestamp
                    eth
                    btc
                  }
        }`
    }

    const url = 'https://api.studio.thegraph.com/query/70107/ethereum-bera-community-users/version/latest'

    return httpPost(url, param).pipe(
        map((res) => {
            const users = res.body.data.depositUsers
            console.log('graph users', users.length);

            if (users.length === 0) {
                return []
            } else {
                return users
            }
        })
    )
}

function writeTo2(file: string, data: RowInfo[], rs: AsyncSubject<boolean>) {
    const ws = fs.createWriteStream(file);
    fastcsv
        .write(data.map(user => (user)), {headers: true})
        .pipe(ws)
        .on('finish', () => {
            console.log('Write to CSV successfully!', file);
            rs.next(true);
            rs.complete();
        })
        .on('error', err => {
            console.error(err);
        });
}

from(list).pipe(
    concatMap(item => {
        return getReferralUsers(item.address, item.code).pipe(delay(2000))
    })
).subscribe({
    complete: () => {
        console.log('Total: ', totalCounter);
    }
})