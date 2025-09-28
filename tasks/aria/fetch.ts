import {httpPost} from "../../utils/http";
import {expand, last, map} from "rxjs/operators";
import {EMPTY, Observable, tap} from "rxjs";
import {SldDecimal} from "../../utils/decimal";
import {genDayIndex} from "../../utils/time";
import {writeCsv} from "../common/csv";

const url: string = "https://app.sentio.xyz/api/v1/graphql/garlic_william/aria2";
const dailyFinal: bigint = genDayIndex('2025-05-16T00:00:00Z') - 1n;
const outFile: string = './data/aria/users.csv';

console.log("daily final", dailyFinal.toString());

type DailyPoint = {
    holder: string;
    dayIndex: number;
    points: string;
}
type DailyPointEntity = {
    holder: string;
    dayIndex: number;
    points: SldDecimal;
}
type UserPoint = {
    id: string;
    idx: number;
    points: SldDecimal;
}


const contracts: Set<string> = new Set([
    '0x148ed6a9237dc8c9f5cda28208567b02ba64c67f',
    '0x000000fee13a103a10d593b9ae06b3e05f2e7e1c',
    '0x000000000004444c5dc75cb358380d2e3de08a90',
    '0xcc01152346de2c2b00c53c68897cd3fbc0136f4b',
    '0x1f2f10d1c40777ae1da742455c65828ff36df387',
    '0x98a8a62e00d6e4bb076a9179b595dac08e89e213',
    '0x4736b02db015dcd1a57a69c889d073b100000000',
    '0xd3f64baa732061f8b3626ee44bab354f854877ac',
    '0xeeeeee9ec4769a09a76a83c7bc42b185872860ee',
    '0x00000000009726632680fb29d3f7a9734e3010e2',
    '0xc36442b4a4522e871399cd717abdd847ab11fe88',
    '0xe44a2179edab1e638eac86079fe4ed850ca77b6c',
    '0x66a9893cc07d91d95644aedd05d03f95e1dba8af',
    '0x00000000a991c429ee2ec6df19d40fe0c80088b8',
    '0x6e0064cb01008bcb00a91f00dc43e500a2ce00d6',
    '0x01d37a36220d52108ae6d453fe6cd80af2906376',
    '0x8af9ca49688e52787f31742dc259002148efaa62',
    '0x2f2dd99235cb728fc79af575f1325eaa270f0c99',
    '0x0f4a1d7fdf4890be35e71f3e0bbc4a0ec377eca3',
    '0x74de5d4fcbf63e00296fd95d33236b9794016631',
    '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
    '0x9008d19f58aabd9ed0d60971565aa8510560ab41',
    '0x22f9dcf4647084d6c31b2765f6910cd85c178c18',
    '0x0d0e364aa7852291883c162b22d6d81f6355428f',
    '0x10ee5304f0e9a5e034f958a26a1f5fcff243ff6f',
    '0xb300000b72deaeb607a12d5f54773d1c19c7028d',
    '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
    '0x4c2bbe8b05f8b2cd2f84acbe4f268e6d946ebeab'
]);

function getDailyPoints(user: string) {
    const param = {
        query: `{
          holderDailyPoints(
            orderBy: dayIndex
            orderDirection: asc
            first: 1000
            where: {holder: "${user}"}
          ) {
            id
            idx
            holder
            dayIndex
            points
          }
        }`
    }
    //
    httpPost(url, param, {header: {"api-key": "1YLrARhl4nxG6PNaPVj0TuZJ3fIe3Ztwd"}}).pipe(
        map((res: any): DailyPoint[] => {
            return res.body.data.holderDailyPoints as DailyPoint[]
        }),
        map(((data: DailyPoint[]) => {
            return data.map(one => {
                return {
                    holder: one.holder,
                    dayIndex: one.dayIndex,
                    points: SldDecimal.fromOrigin(BigInt(one.points), 18)
                }
            })
        })),
        tap((data: DailyPointEntity[]) => {
            const ariaDailies = data.filter((one: DailyPointEntity): boolean => one.dayIndex < Number(dailyFinal));

            const total0: SldDecimal = data.reduce((acc, cur): SldDecimal => {
                return acc.add(cur.points)
            }, SldDecimal.ZERO)
            const total1: SldDecimal = ariaDailies.reduce((acc, cur) => {
                return acc.add(cur.points)
            }, SldDecimal.ZERO)

            console.log("total 0 points: ", total0.format());
            console.log("total 1 points: ", total1.format());
        })
    ).subscribe()
}

function getAllUserPoints(): Observable<UserPoint[]> {
    return fetchUser(0).pipe(
        expand(({users, next}) => {
            if (!next) {
                return EMPTY;
            }

            const offset: number = users.length;
            return fetchUser(offset).pipe(map(({users: newUsers, next: newNext}) => {
                return {
                    users: users.concat(newUsers),
                    next: newNext
                }
            }))
        }),
        last(),
        map(({users}) => {
            return users;
        })
    )
}

function fetchUser(offset: number): Observable<{ users: UserPoint[], next: boolean }> {
    const param: any = userParam(offset);
    return httpPost(url, param, {header: {"api-key": "1YLrARhl4nxG6PNaPVj0TuZJ3fIe3Ztwd"}}).pipe(
        map((res) => {
            return res.body.data.ariaPoints as { id: string, idx: number, points: string }[]
        }),
        map((users) => {
            return users.map((user) => {
                return {
                    id: user.id,
                    idx: user.idx,
                    points: SldDecimal.fromOrigin(BigInt(user.points), 18)
                }
            })
        }),
        map((users) => {
            return {
                users,
                next: users.length === 1000,
            }
        })
    )
}

function userParam(offset: number): any {
    return {
        query: `
        {
          ariaPoints(
            skip: ${offset},
            first: 1000,
            orderBy: idx,
          ) {
            id
            idx
            points
          }
        }
    `
    }
}

function writeUserPoints(users: UserPoint[]): void {
    const rows = users.map(user => {
        const pointNum: string = Number(user.points.toNumeric()).toFixed(2);
        const point: SldDecimal = SldDecimal.fromNumeric(pointNum, 2);

        return {
            address: user.id,
            points: point
        }
    })

    const total: SldDecimal = rows.reduce((acc, cur) => {
        return acc.add(cur.points)
    }, SldDecimal.ZERO);

    rows.sort((a, b) => {
        return a.points.sub(b.points).lte(SldDecimal.ZERO) ? -1 : 1;
    })


    rows.push({address: 'Total', points: total})


    const rows1 = rows.map((row) => {
        return {
            address: row.address,
            points: row.points.toNumeric()
        }
    })

    //
    writeCsv(outFile, rows1);
}

//
// 1,300,899 679498967554201916
// getDailyPoints('0x04b0f18b9b1ff987c5d5e134516f449aa9a2e004');

getAllUserPoints()
    .pipe(
        tap((users: UserPoint[]): void => {
            writeUserPoints(users);
        })
    )
    .subscribe();