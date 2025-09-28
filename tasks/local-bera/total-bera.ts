import {readCsv, writeCsv} from "../common/csv";
import {map} from "rxjs/operators";
import {SldDecimal} from "../../utils/decimal";
import {tap, zip} from "rxjs";

type FinalRow = {
    address: string;
    stonePoints: SldDecimal;
    sbtcPoints: SldDecimal;
    stoneAmount: SldDecimal;
    sbtcAmount: SldDecimal;
    totalAmount: SldDecimal;
    totalFinal: SldDecimal;
};

function emptyRow(address: string): FinalRow {
    return {
        address,
        stonePoints: SldDecimal.ZERO,
        sbtcPoints: SldDecimal.ZERO,
        stoneAmount: SldDecimal.ZERO,
        sbtcAmount: SldDecimal.ZERO,
        totalAmount: SldDecimal.ZERO,
        totalFinal: SldDecimal.ZERO,
    }
}

const RowMaps = new Map<string, FinalRow>();

function initRow(address: string): FinalRow {
    if (RowMaps.has(address)) {
        return RowMaps.get(address)!;
    } else {
        const init = emptyRow(address);
        RowMaps.set(address, init);

        return init;
    }
}

function compute(): void {
    const stoneFile: string = './data/local_bera/stone_bera.csv';
    const sbtcFile: string = './data/local_bera/btc_bera.csv';

    //
    const stoneRead$ = readCsv(stoneFile)
        .pipe(
            map((rows) => {
                rows.forEach(row => {
                    const final: FinalRow = initRow(row.address);
                    //
                    final.stonePoints = SldDecimal.fromNumeric(row.points, 18);
                    final.stoneAmount = SldDecimal.fromNumeric(row.amount, 18);
                })
            })
        );

    const sbtcRead$ = readCsv(sbtcFile)
        .pipe(
            map((rows) => {

                rows.forEach(row => {
                    const final: FinalRow = initRow(row.address);

                    final.sbtcPoints = SldDecimal.fromNumeric(row.points, 18);
                    final.sbtcAmount = SldDecimal.fromNumeric(row.amount, 18);
                });
                //
            })
        );

    zip(stoneRead$, sbtcRead$).pipe(
        tap(() => {
            RowMaps.forEach(one => {
                one.totalAmount = one.stoneAmount.add(one.sbtcAmount);
            })
        })
    ).subscribe({
        next: () => {
            let finalsRows = Array.from(RowMaps.values());

            finalsRows = finalsRows.sort((a, b) => {
                return a.totalAmount.sub(b.totalAmount).gtZero() ? 1 : -1;
            })

            let finalTotalAmount = SldDecimal.ZERO;
            let finalCount = 0;
            finalsRows.forEach(row => {
                if (row.address === 'Total') {
                    return;
                }

                finalCount++;
                const cut1: string = row.totalAmount.format({fix: 2, split: false});
                const cut2: string = Number(row.totalAmount.toNumeric()).toFixed(2);
                if (finalCount < 10000 && cut1 !== cut2) {
                    console.log(row.totalAmount.toNumeric(), cut1, cut2);
                }

                row.totalFinal = SldDecimal.fromNumeric(Number(row.totalAmount.toNumeric()).toFixed(2), 2)

                finalTotalAmount = finalTotalAmount.add(row.totalFinal);
            })

            console.log("final total amount", finalCount, finalTotalAmount.format());


            const rows = finalsRows.map(one => {
                return {
                    address: one.address,
                    stonePoints: one.stonePoints.toNumeric(),
                    sbtcPoints: one.sbtcPoints.toNumeric(),
                    stoneAmount: one.stoneAmount.toNumeric(),
                    sbtcAmount: one.sbtcAmount.toNumeric(),
                    totalAmount: one.totalAmount.toNumeric(),
                    totalFinal: one.totalFinal.toNumeric()
                }
            })

            const a = rows.find(one => one.address === 'Total');
            if (a) {
                a.totalFinal = finalTotalAmount.toNumeric();
            }


            writeCsv('./data/local_bera/total_bera.csv', rows);
        }
    })
}


compute();