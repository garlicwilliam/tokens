import {theGraphQuery} from "../../utils/graph";
import {concatMap, expand, last, map, toArray} from "rxjs/operators";
import {EMPTY, from, Observable, switchMap, tap, zip} from "rxjs";
import {genDayIndex} from "../../utils/time";
import {intArray} from "../../utils/array";
import {readCsv, writeCsv} from "../common/csv";
import {SldDecimal} from "../../utils/decimal";
import {isAddressIn, isSameAddress} from "../../utils/address";
import {E18} from "../../utils/big-number";

const hold = 'https://gateway.thegraph.com/api/subgraphs/id/8BGeis9bYwM7SGhPq5qnNFUKLAcgAFBstrvpsdSoRdk3';
const pancakeX1 = 'https://gateway.thegraph.com/api/subgraphs/id/7ZnuQ1gfBL93qkEH1PHEo3tKFtuL4D5jtERHZ7RnuWn9';
const pancakeUSDTX1 = 'https://api.studio.thegraph.com/query/70107/sc-usd-1-pancake-usdt-x-1/version/latest';
const startDay = '2025-09-15T00:00:00Z'; // start time, adjust as needed
const endDay = '2025-09-21T00:00:00Z'; // include this day

const fix = 18;

const pancakePool: string = '0xe95101cb367cc1ef284270ebbce12fadf5e2c05c';
const pancakeBnbPool: string = '0x6fb6E435E906E40b70D009eb3a8998BbB6056494';
const unknownAddress: string = '0xd175074944d964a8acbdc1b4db7593d59e151a3c';
const cian: string = '0x15cbff12d53e7bde3f1618844caaef99b2836d2a';

type Period = { startDay: number, lastDay: number };
type RowType = {
    holder: string,
    points: bigint,
    allDuration: number,
    avgBalance: bigint,
    lastBalance: bigint
};
type PancakeRowType = {
    holder: string;
    points: bigint;
}
type Snapshot = {
    holder: string;
    idx: number;
    points: bigint;
    start: number;
    end: number;
    duration: number;
    balance: bigint;
}
type FinalRow = {
    user: string;

    holdWeight: string;
    holdDuration: string;
    holdAvgBalance: string;
    holdLastBalance: string;

    pancakeWeight: string;

    finalWeight: number;
}

function fetchDayIndex(): Period {
    const first = genDayIndex(startDay);
    const last = genDayIndex(endDay);

    return {startDay: Number(first), lastDay: Number(last)};
}


function fetchHolders(offset: number): Observable<string[]> {
    return theGraphQuery(hold, {
        query: `{
          holders(first: 1000, orderBy: idx,  
            where: {
              idx_gt: ${offset}
            }
          ){
            id
            idx
          }
        }`
    })
        .pipe(map((res) => {
            const holders: { id: string }[] = res.data.holders;
            return holders.map(one => one.id);
        }));
}

function fetchPageHolders(offset: number): Observable<{ holders: string[], next: boolean }> {

    return fetchHolders(offset).pipe(
        map((holders: string[]) => {
            return {
                holders,
                next: holders.length === 1000
            }
        })
    )
}

function fetchAllHolders(): Observable<string[]> {
    return fetchPageHolders(0).pipe(
        expand(({holders, next}) => {
            if (!next) {
                return EMPTY;
            }

            return fetchPageHolders(holders.length).pipe(
                map(({holders: newHolders, next: newNext}) => {
                    return {holders: [...holders, ...newHolders], next: newNext};
                })
            )
        }),
        map(({holders}) => {
            return holders;
        }),
        last()
    )
}

// ------------------------------------------------------


function fetchHolderDailyPoints(holder: string, period: Period): Observable<bigint> {
    const days: string = intArray(period.startDay, period.lastDay).map(one => `${one}`).join(',');
    return theGraphQuery(hold, {
        query: `{
            holderDailySnapshots(
                where: {
                   holder: "${holder}",
                   dayIndex_in: [${days}]
                },
                orderBy: idx
            ) {
                holder
                dayIndex
                points
                idx
            }
        }`
    }).pipe(
        map((res: any) => {
            const daily = res.data.holderDailySnapshots;
            const dPoints: string[] = daily.map((one: any) => {
                return one.points;
            })

            return dPoints.length > 0
                ? dPoints.map(one => BigInt(one)).reduce((a, b) => a + b)
                : 0n;
        })
    );
}

// ---------------------------------------------------------

function fetchHolderTokenSnapshots(holder: string, period: Period): Observable<Snapshot[]> {
    const startTime = period.startDay * 86400;
    const endTime = (period.lastDay + 1) * 86400;

    return theGraphQuery(hold, {
        query: `{
          tokenHolderSnapshots(
            first: 1000,
            where: {
              and: [
                { holder: "${holder}"}
                {
                  or: [
                    { 
                        durationStart_gte: ${startTime},
                        durationEnd_lte: ${endTime}
                    },
                    {
                        durationStart_lt: ${startTime},
                        durationEnd_gt: ${startTime}
                    },
                    {
                        durationStart_lt: ${endTime},
                        durationEnd_gt: ${endTime}
                    }
                  ]
                }
              ],
            },
            orderBy: idx,
          ) {
            holder
            idx
            durationStart
            durationEnd
            durationTime
            balance
            points
          }
        }`
    }).pipe(map((res) => {
        if (!res || !res.data || !res.data.tokenHolderSnapshots) {
            console.warn('res', res);
        }
        const shots = res.data.tokenHolderSnapshots;


        return shots.map((shot: any): Snapshot => {
            return {
                holder: shot.holder,
                idx: shot.idx,
                points: BigInt(shot.points),
                start: shot.durationStart,
                end: shot.durationEnd,
                duration: BigInt(shot.balance) > 0n ? shot.durationTime : 0,
                balance: BigInt(shot.balance),
            }
        })
    }))
}

function mergeHolderTokenSnapshots(shots: Snapshot[], period: Period): Snapshot[] {
    const startTime = period.startDay * 86400;
    const endTime = (period.lastDay + 1) * 86400;

    const newShots: Snapshot[] = shots.map(one => {
        if (one.start < startTime) {
            one.start = startTime;
        }

        if (one.end > endTime) {
            one.end = endTime;
        }

        one.duration = one.end - one.start;

        return one;
    })


    const finalShots: Snapshot[] = [];

    while (newShots.length > 0) {
        const fir = newShots.shift();
        if (!fir) {
            continue;
        }

        if (finalShots.length === 0) {
            finalShots.push(fir);
        } else {
            const cur: Snapshot = finalShots[finalShots.length - 1];
            // 余额不变
            if (cur.balance === fir.balance && cur.end === fir.start) {
                // merge
                cur.end = fir.end;
                cur.duration = cur.end - cur.start;
                cur.points += fir.points;
            } else {
                // not merge
                finalShots.push(fir);
            }
        }
    }

    return finalShots;
}

function fetchHolderSnapshots(holder: string, period: Period): Observable<{ shots: Snapshot[], lastBalance: bigint }> {
    return fetchHolderTokenSnapshots(holder, period).pipe(
        map((shots: Snapshot[]) => {
            if (holder === '0x82157a92425f534f654ae3c90f1372758fd54241') {
                console.log("shots", shots);
            }
            return mergeHolderTokenSnapshots(shots, period);
        }),
        map((shots: Snapshot[]) => {
            return {
                shots,
                lastBalance: shots.length > 0 ? shots[shots.length - 1].balance : 0n // last balance
            }
        })
    )
}


//
function fetchHolderInfo(holder: string, period: Period): Observable<RowType> {
    const points$ = fetchHolderDailyPoints(holder, period);
    const amount$ = fetchHolderSnapshots(holder, period);

    return zip(points$, amount$).pipe(
        map(([points, amount]) => {

            const allDuration: number = amount.shots.reduce((acc, cur) => {
                return acc + cur.duration;
            }, 0);
            const allBalance: bigint = amount.shots.reduce((acc, cur) => {
                return acc + (cur.balance * BigInt(cur.duration));
            }, 0n);
            const avgBalance: bigint = allDuration > 0 ? allBalance / BigInt(allDuration) : 0n;

            return {
                holder,
                points,
                lastBalance: amount.lastBalance,
                avgBalance,
                allDuration: allBalance > 0 ? allDuration : 0, // 如果余额为0，则设置持续时间也为0
            }
        }),
        tap((row) => {
            console.log(row.holder, row.avgBalance, row.allDuration, row.lastBalance, row.points);
        })
    );
}

// ----------------------------------------------------------

function fetchPancakeHolders(offset: number, url: string): Observable<string[]> {
    return theGraphQuery(url, {
        query: ` {
          positionHolders(
            orderBy: idx,
            first: 1000,
            where: {
              idx_gt: ${offset}
            }
          ) {
            id
            idx
          }
        }`
    }).pipe(
        map((res) => {
            const holders: { id: string }[] = res.data.positionHolders;
            return holders.map(one => one.id);
        })
    )
}


function fetchPancakePageHolders(offset: number, url: string): Observable<{ holders: string[], next: boolean }> {
    return fetchPancakeHolders(offset, url).pipe(
        map((holders: string[]) => {
            return {
                holders,
                next: holders.length === 1000
            }
        })
    )
}


function fetchAllPancakeHolders(url: string): Observable<string[]> {
    return fetchPancakePageHolders(0, url).pipe(
        expand(({holders, next}) => {
            if (!next) {
                return EMPTY;
            }

            return fetchPancakePageHolders(holders.length, url).pipe(
                map(({holders: newHolders, next: newNext}) => {
                    return {holders: [...holders, ...newHolders], next: newNext};
                })
            )
        }),
        map(({holders}) => {
            return holders;
        }),
        last()
    )
}


// ---------------------------------------------------------

function fetchPancakeHolderPoints(holder: string, period: Period, url: string): Observable<bigint> {
    const dayIndexes: string = intArray(period.startDay, period.lastDay).map(one => `${one}`).join(', ');

    return theGraphQuery(url, {
        query: `{
          positionHolderDailies(
            where: {
              holder: "${holder}",
              dayIndex_in: [${dayIndexes}]
            },
            orderBy: idx
          ) {
            points
            holder
            dayIndex
            idx
          }
        }`
    }).pipe(
        map((res) => {
            const dailies = res.data.positionHolderDailies;
            const points: string[] = dailies.map((one: any) => {
                return one.points;
            });
            return points.length > 0
                ? points.map(one => BigInt(one)).reduce((a, b) => a + b)
                : 0n;
        })
    )

}

// ---------------------------------------------------------

function exe() {
    fetchAllHolders().pipe(
        switchMap((holders: string[]) => {
            console.log("all holders", holders.length);
            return from(holders);
        }),
        concatMap((holder: string) => {
            const period: Period = fetchDayIndex();
            return fetchHolderInfo(holder, period);
        }),
        toArray(),
        map((res: RowType[]) => {
            return res;
        })
    ).subscribe({
        next: (rows) => {
            writeCsv('./data/scusd1/holders.csv', rows)
        }
    })
}

function exe1(url: string, file: string) {
    fetchAllPancakeHolders(url).pipe(
        switchMap((holders: string[]) => {
            return from(holders);
        }),
        concatMap((holder: string) => {
            const period: Period = fetchDayIndex();
            return fetchPancakeHolderPoints(holder, period, url).pipe(
                map((points: bigint) => {
                    return {
                        holder,
                        points
                    }
                })
            )
        }),
        toArray(),
        map((res: { holder: string, points: bigint }[]) => {
            return res;
        })
    ).subscribe({
        next: (rows) => {
            writeCsv(file, rows)
        }
    })
}

function exePancakeUsd1() {
    exe1(pancakeX1, './data/scusd1/pancake-usd1.csv');
}

function exePancakeUsdt() {
    exe1(pancakeUSDTX1, './data/scusd1/pancake-usdt.csv');
}

function mergeFile() {

    readCsv('./data/scusd1/holders.csv').pipe(
        map((rows: RowType[]) => {
            return rows.map((line): FinalRow => {
                return {
                    user: line.holder,

                    holdDuration: line.allDuration.toString(),
                    holdAvgBalance: SldDecimal.fromOrigin(line.avgBalance, 18).format({split: false, fix: fix}),
                    holdLastBalance: SldDecimal.fromOrigin(line.lastBalance, 18).format({split: false, fix: fix}),
                    holdWeight: SldDecimal.fromOrigin(line.points, 18).format({split: false, fix: fix}),

                    pancakeWeight: '0',

                    finalWeight: Number(SldDecimal.fromOrigin(line.points, 18).format({split: false, fix: fix}))
                }
            })
        }),
        switchMap((rows: FinalRow[]) => {
            return readCsv('./data/scusd1/pancake-usd1.csv').pipe(
                map((pancakeRows: PancakeRowType[]) => {

                    pancakeRows.forEach((pancake: PancakeRowType) => {
                        const curRow = rows.find(one => isSameAddress(one.user, pancake.holder))
                        if (curRow) {
                            curRow.pancakeWeight = SldDecimal.fromOrigin(BigInt(pancake.points), 18).format({
                                split: false,
                                fix: fix
                            });
                            curRow.finalWeight = curRow.finalWeight + Number(curRow.pancakeWeight);
                        } else {
                            const weight = SldDecimal.fromOrigin(BigInt(pancake.points), 18).format({
                                split: false,
                                fix: fix
                            });

                            const newRow: FinalRow = {
                                user: pancake.holder,
                                holdDuration: '0',
                                holdAvgBalance: '0',
                                holdLastBalance: '0',
                                holdWeight: '0',
                                pancakeWeight: SldDecimal.fromOrigin(pancake.points, 18).format({
                                    split: false,
                                    fix: fix
                                }),

                                finalWeight: Number(weight)
                            }

                            rows.push(newRow);
                        }
                    })

                    return rows;
                }),
            )
        }),
        switchMap((rows1: FinalRow[]) => {
            return readCsv('./data/scusd1/pancake-usdt.csv').pipe(
                map((pancakeRows1: PancakeRowType[]) => {

                    pancakeRows1.forEach((pancake1: PancakeRowType) => {
                        const curRow1: FinalRow | undefined = rows1.find(one => isSameAddress(one.user, pancake1.holder));

                        if (curRow1) {
                            // usdt，当前处理的pancake weight
                            const pancakeUsdt: SldDecimal = SldDecimal.fromOrigin(BigInt(pancake1.points), fix);

                            // usd1, 原来的pancake weight
                            const pancakeUsd1: SldDecimal = SldDecimal.fromNumeric(curRow1.pancakeWeight, fix);

                            // pancake weight: string
                            curRow1.pancakeWeight = pancakeUsdt.add(pancakeUsd1).format({split: false, fix: fix});

                            // final weight = final weight + usdt weight
                            curRow1.finalWeight = curRow1.finalWeight + Number(pancakeUsdt.format({
                                fix: fix,
                                split: false
                            }));
                        } else {

                            const weight = SldDecimal.fromOrigin(pancake1.points, fix).format({split: false, fix: fix});

                            const newRow: FinalRow = {
                                user: pancake1.holder,
                                holdDuration: '0',
                                holdAvgBalance: '0',
                                holdLastBalance: '0',
                                holdWeight: '0',
                                pancakeWeight: SldDecimal.fromOrigin(pancake1.points, fix).format({
                                    split: false,
                                    fix: fix
                                }),

                                finalWeight: Number(weight)
                            }

                            rows1.push(newRow);
                        }
                    })

                    return rows1;
                })
            )
        }),
        map((rows) => {
            // 排序
            return rows.sort((a, b) => {
                if (b.finalWeight == a.finalWeight) {
                    const isGt: boolean = SldDecimal.fromNumeric(a.holdLastBalance, 18)
                        .gt(SldDecimal.fromNumeric(b.holdLastBalance, 18));

                    return isGt ? -1 : 1;
                }

                return (b.finalWeight - a.finalWeight)
            });
        }),
        map((rows) => {
            // 过滤掉一些地址
            return rows.filter(one => !isAddressIn(one.user, [pancakePool, pancakeBnbPool, unknownAddress, cian])).map((row: FinalRow) => {
                const row1: any = {...row};
                row1.finalWeight = row.finalWeight.toFixed(fix);

                return row1;
            }).filter(one => Number(one.finalWeight) > 0);
        }),
    ).subscribe({
        next: (rows: any[]) => {
            writeCsv('./data/scusd1/final.csv', rows);
        }
    })
}


function distributeTokens(amounts: bigint) {
    readCsv('./data/scusd1/final.csv').pipe(
        map((rows: any[]) => {
            const totalWeight: SldDecimal = rows.map(one => SldDecimal.fromNumeric(one.finalWeight, fix))
                .reduce((a, b) => a.add(b), SldDecimal.ZERO);

            console.log("total weight", totalWeight.format({split: false, fix: fix}));

            const totalToken: SldDecimal = SldDecimal.fromOrigin(amounts * E18, 18);

            return rows.map(one => {
                const weight: SldDecimal = SldDecimal.fromNumeric(one.finalWeight, fix);
                const token: SldDecimal = totalToken.mul(weight.toE18()).div(totalWeight.toE18());

                return {
                    ...one,
                    token: token.format({split: false, fix: fix})
                }
            })
        })
    ).subscribe({
        next: (rows) => {
            writeCsv('./data/scusd1/distribute.csv', rows);
        }
    })
}


mergeFile();

console.log(new Date(startDay).getTime() / 1000);
console.log(new Date(endDay).getTime() / 1000 + 86400);