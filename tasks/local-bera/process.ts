import {readCsv, writeCsv} from "../common/csv";
import {map} from "rxjs/operators";
import {SldDecimal} from "../../utils/decimal";
import {Observable, switchMap} from "rxjs";


type EthRow = {
    address: string;
    points: SldDecimal;
}

function readAddrMap(file: string): Observable<Map<string, string>> {
    return readCsv(file).pipe(
        map((rows: any[]) => {
            const addrMap: Map<string, string> = new Map<string, string>();

            rows.forEach(row => {
                const src: string = row.src;
                const tar: string = row.tar;
                addrMap.set(src, tar);
            })

            return addrMap;
        })
    )
}

function readInvalidAddr(file: string): Observable<Set<string>> {
    return readCsv(file).pipe(
        map((rows: any[]) => {
            const invalidAddr: Set<string> = new Set<string>();

            rows.forEach(row => {
                const addr: string = row.address;
                invalidAddr.add(addr);
            })

            return invalidAddr;
        })
    )
}


function readSrc(file: string, out: string): void {

    readCsv(file).pipe(
        map((rows: any[]): Map<string, SldDecimal> => {
            const cache: Map<string, SldDecimal> = new Map<string, SldDecimal>();

            rows.forEach(row => {
                const address: string = row.address;
                const points: SldDecimal = SldDecimal.fromNumeric(row.points_eth, 18);

                cache.set(address, points);
            })

            return cache;
        }),
        switchMap((pointsMap: Map<string, SldDecimal>) => {
            return readAddrMap('./data/local_bera/address_map.csv').pipe(
                map((addrMap: Map<string, string>) => {
                    // 将把src地址的点数加到tar地址上，src的地址不再使用
                    addrMap.forEach((tar, src) => {
                        // 转移积分
                        if (pointsMap.has(src)) {
                            const movePoints: SldDecimal = pointsMap.get(src)!;
                            const oldPoints: SldDecimal = pointsMap.get(tar) || SldDecimal.ZERO;
                            const newPoints: SldDecimal = oldPoints.add(movePoints);

                            pointsMap.set(tar, newPoints);
                            pointsMap.delete(src);
                        }
                    });

                    return pointsMap;
                })
            )
        }),
        switchMap((maps: Map<string, SldDecimal>) => {

            return readInvalidAddr('./data/local_bera/user_invalid.csv').pipe(
                map((invalid: Set<string>) => {
                    const rows: EthRow[] = [];

                    maps.forEach((val, key) => {
                        if (val.gtZero() && !invalid.has(key)) {
                            rows.push({address: key, points: val});
                        }

                    });

                    return rows.sort((a, b) => a.points.sub(b.points).ltZero() ? -1 : 1);

                })
            )

        })
    ).subscribe({
        next: (rows: EthRow[]) => {
            let total: SldDecimal = SldDecimal.ZERO;

            const lines: any[] = rows.map((one) => {
                total = total.add(one.points);
                return ({address: one.address, points: one.points.toNumeric()})
            })

            lines.push({address: 'Total', points: total.toNumeric()});

            writeCsv(out, lines);
        }
    });
}


readSrc('./data/local_bera/local_bera_points_final.csv', './data/local_bera/stone.csv');