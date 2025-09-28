import {httpPost} from "../utils/http";
import {map} from "rxjs/operators";
import {AsyncSubject, Observable, tap} from "rxjs";
import fs from "fs";
import * as fastcsv from "fast-csv";
import {formatTime} from "../utils/time";
import {SldDecimal} from "../utils/decimal";

const graphUrl: string = 'https://api.studio.thegraph.com/query/70107/bsc-bnbchain-task/version/latest';

type User = {
    id: string;
    taskDoneIdx: number;
    taskDoneTimestamp: string;
    minted: string;
}

function exeParam(): Observable<User[]> {
    return httpPost(graphUrl, genParam()).pipe(
        map((res) => {

            const users: User[] = res.body.data.mintTaskUsers;
            console.log('get users', users.length);

            return users;
        })
    )
}

function genParam() {
    return {
        query: `{
            mintTaskUsers(
                first: 1000,
                where: {taskDone: true},
                orderBy: taskDoneIdx
            ) {
                id,
                idx
                taskDone
                taskDoneIdx
                taskDoneBlock
                taskDoneTimestamp
                minted
            }
        }`
    }
}

function postTaskUser(users: User[]) {
    const url = 'https://dapp-server.bnbchain.world/api/v1/campaign-project/upload-user';
    const token = 'SQAKJLc6HLcfib38SxaB22xYqKh3mN1C';
    const body = {
        token,
        data: users.map(one => {
            return {
                taskId: 1,
                timestamp: Number(one.taskDoneTimestamp),
                address: one.id,
            }
        })
    }

    httpPost(url, body).pipe(
        tap((res) => {
            console.log(res.body);
        })
    ).subscribe()
}

function writeTo2(file: string, data: any[]) {
    const ws = fs.createWriteStream(file);
    fastcsv
        .write(data.map(user => (user)), {headers: true})
        .pipe(ws)
        .on('finish', () => {
            console.log('Write to CSV successfully!', file);

        })
        .on('error', err => {
            console.error(err);
        });
}

// exeParam().subscribe({
//     next: (users: User[]) => {
//         const rows = users.map(one => {
//             return {
//                 no: one.taskDoneIdx,
//                 address: one.id,
//                 time: formatTime(new Date(Number(one.taskDoneTimestamp) * 1000)),
//                 minted: SldDecimal.fromOrigin(BigInt(one.minted), 18).format({fix: 6, split: false})
//             }
//         })
//
//         writeTo2('./data/bnb/minted.csv', rows);
//     }
// })

const winners: string[] = [
    "0x1644f1d03f537c5fec0d8df3a14b79cfd71bf9b6",
    "0xff4427c766d0161c1f1c9bf60a470c00801114d5",
    "0x36e4fa6ec7f5145ac88ed48b68a1ec06370ca452",
    "0xff1f2cb646a71bf807884d06e73c75d8148c4104",
    "0x88a962461ebcf47722f01dd05b31fc4f5953c985",
    "0xe8b4757f315d9987907734c2361b54e1f448c487",
    "0x8d834919956af4f696f729bdcaba61c9f16529f5",
    "0x9767c319c04fccd885766538484fd4aadb0a4905",
    "0xb7d0f4803c6ae5e554007dbb35da63587f3b4493",
    "0xf9a0d152e7a936b9f6507e8685703c395a092848",
    "0x896e0a8b9b9c0370aa928c7b547a1cf4c6a4e99e",
    "0x9eeaab14e43250cfc04a1901b734779cbccb5d5e",
    "0xed2c9aff19a6b5d43383624472e85bad29a036ac",
    "0x2e5238ba9577cf294bb227350257eee58ffaa735",
    "0x6873beb660a6cf51aba0e4ca3e87893c109c14d1",
    "0x84b8bd06f8d84f0d640357f1ce977a9abf516699",
    "0x7488a08e91427c0915ce468dd617416da5dbb30c",
    "0x024287d44fa11db45dfb443ecf37a7794644d258",
    "0xce436925fc6c89e4de22c35ac6e2dfa2c763d192",
    "0xf2151c5eb4506c78e8325706a15ac1f92515bb73",
    "0x91b5dc8c6885281fdd924050f4233c394e5e94a6",
    "0xf301bec395546c22b426ca2909e1bc7d9bc6382f",
    "0x2561a222dd48539a18b9e4dd31fb11e897fa1d86",
    "0x70b52934105f6b4a5e5fd4b7eb17164f023f3865",
    "0x184762ce2a96a340cc1f9a62798fd3a5145a7135",
    "0x907672afea9dffa0f6990511ad6b867eb320900b",
    "0x4c5019f3af0e09b5ce6064705436dc1ba8a132df",
    "0x09c7bd0490035a68ff00b2d3122c83ed70624b32",
    "0x0422d5edbc2becb3e9fce11a5bd31d0a9b0ed516",
    "0x552b55651ad8c852b293e6fffdc8bf3d0a2d5784",
    "0xb36617dbf0c15249b6bcff66611c3f78951347d1",
    "0xb4dfce5b298f826365220448f45bc0d2452fdfd5",
    "0xeb7bd07eb559e696b8e31fde1acd03481589f455",
    "0x4772a15b7fbf67aeb3e954d9ddbb8dd50147b077",
    "0xee4652c016bc5197676c2235f38365a922ff8001",
    "0xe1d5b58e05d7554337e80cb6babe24dfc64d7852",
    "0x487b147ea9303e3d3f713cbe1afd16f2b1c7dfbc",
    "0x66ae89f40599c5269930f395757d43bc688bf506",
    "0x2528dddd4ddd210c483c2bf75dd44d94cd05acae",
    "0xd64ee295c0a8159ecb3f12d09ab57780f7108c56",
    "0x526e3242678149bf353c0396d83e336d07da8b50",
    "0xb7b6654268d045b8e0393ec754de2bb6e4ff339b",
    "0x2719e4c5f93224f02d7b0ca9f86894a98f49e21b",
    "0x60d8d8e376e84b1885dba499cc493f1f1062af52",
    "0xd799b2561061ab241a163d979acb4389cdd26943",
    "0xe9d6ee3900624d3fda4a5d7d49a9b7a145668fa1",
    "0x75792ac4016a1374472f990a25a417306238dbbd",
    "0xb86112c68959c3d9f706a9d0a943b7f71e319759",
    "0xe71cf2fc50c5e3f8e690fd3d1a1b9f4b445af7bf",
    "0xc98dcea8d5735885827b8adddb6f7f5cf3ef546d"
]

function postTaskWinner(users: string[]) {
    const url = 'https://dapp-server.bnbchain.world/api/v1/campaign-project/upload-user-reward';
    const token = 'SQAKJLc6HLcfib38SxaB22xYqKh3mN1C';
    const body = {
        token,
        data: users.map((one: string) => {
            return {
                reward: "0.1 BNB",
                address: one,
            }
        })
    }

    httpPost(url, body).pipe(
        tap((res) => {
            console.log(res.body);
        })
    ).subscribe()
}

postTaskWinner(winners);