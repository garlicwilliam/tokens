import {readCsv, writeCsv} from "../common/csv";
import {map} from "rxjs/operators";
import {SldDecimal} from "../../utils/decimal";


export function beraStone() {
    readCsv('./data/local_bera/stone.csv').pipe(
        map((rows: any[]) => {
            const bera: SldDecimal = SldDecimal.fromNumeric('1382940.83', 18)
            let total: SldDecimal = SldDecimal.ZERO;
            rows.forEach((row) => {
                const p = SldDecimal.fromNumeric(row.points, 18);
                total = total.add(p);
            })

            const newRows = rows.map((row) => {
                const address: string = row.address;
                const points: SldDecimal = SldDecimal.fromNumeric(row.points, 18);
                const amount: SldDecimal = bera.mul(points.toOrigin()).div(total.toOrigin());

                return {
                    address,
                    points: row.points,
                    amount: amount.toNumeric()
                }
            })

            newRows.push({
                address: 'Total',
                points: total.toNumeric(),
                amount: bera.toNumeric()
            })

            return newRows;
        }),
    ).subscribe({
        next: (rows) => {
            writeCsv('./data/local_bera/stone_bera.csv', rows);
        }
    });
}


export function beraSBtc() {
    readCsv('./data/local_bera/btc.csv').pipe(
        map((rows: any[]) => {
            const bera: SldDecimal = SldDecimal.fromNumeric('71222.72', 18);
            let total: SldDecimal = SldDecimal.ZERO;

            rows.forEach((row) => {
                const p = SldDecimal.fromNumeric(row.points, 18);
                total = total.add(p);
            });

            const newRows = rows.map((row) => {
                const address: string = row.address;
                const points: SldDecimal = SldDecimal.fromNumeric(row.points, 18);
                const amount: SldDecimal = bera.mul(points.toOrigin()).div(total.toOrigin());

                return {
                    address,
                    points: row.points,
                    amount: amount.toNumeric()
                }
            })

            newRows.push({
                address: 'Total',
                points: total.toNumeric(),
                amount: bera.toNumeric()
            })

            return newRows;
        })
    ).subscribe({
        next: (rows) => {
            writeCsv('./data/local_bera/btc_bera.csv', rows);
        }
    });
}


beraStone();
beraSBtc();