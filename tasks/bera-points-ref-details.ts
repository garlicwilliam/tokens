import {AsyncSubject, Observable, zip} from "rxjs";
import {httpGet} from "../utils/http";
import {finalize, map} from "rxjs/operators";
import fs from "fs";
import * as fastcsv from "fast-csv";
import {formatTime} from "../utils/time";
import {SldDecimal} from "../utils/decimal";

type StoneRefDetail = {
    "idx": number,
    "start": string,
    "end": string,
    "duration": number,
    "from": string,
    "to": string,
    "sendPoints": string,
}

export function getBeraPointsRefDetails(refAddress: string): Observable<any> {
    const address = refAddress.toLowerCase();
    const lpFile = `./data/bera_ref_points/beraSTONE_ref_lp_${address}.csv`;
    const uniFile = `./data/bera_ref_points/beraSTONE_ref_uni_${address}.csv`;

    const rs1 = new AsyncSubject<boolean>();
    const rs2 = new AsyncSubject<boolean>();

    getStoneLpRefDetails(refAddress).pipe(
        finalize(() => {
            rs1.next(true);
            rs1.complete();
        })
    ).subscribe({
        next: (details) => {
            writeStoneRefDetails(details, lpFile);
        },
        error: (err) => {
            console.error(err);
        }
    });

    getStoneUniRefDetails(refAddress).pipe(
        finalize(() => {
            rs2.next(true);
            rs2.complete();
        })
    ).subscribe({
        next: (details) => {
            writeStoneRefDetails(details, uniFile);
        },
        error: (err) => {
            console.error(err);
        }
    });

    return zip(rs1, rs2).pipe(map(([f1, f2]) => {
        return f1 && f2;
    }));
}

function getStoneLpRefDetails(address: string): Observable<StoneRefDetail[]> {
    const url = `https://points.stakestone.io/bera_points/detail/${address}/shot_bera_stone_ref`;
    return httpGet(url).pipe(
        map(res => {
            if (res.status !== 200) {
                throw Error(`getStoneLpRefDetails Error: ${res.status}`);
            }

            if (!res.body.isOK) {
                throw Error(`getStoneLpRefDetails Error: ${res.body.message}`);
            }

            return res.body.details;
        })
    )
}

function getStoneUniRefDetails(address: string): Observable<StoneRefDetail[]> {
    const url = `https://points.stakestone.io/bera_points/detail/${address}/shot_bera_stone_uni_ref`;
    return httpGet(url).pipe(
        map(res => {
            if (res.status !== 200) {
                throw Error(`getStoneUniRefDetails Error: ${res.status}`);
            }

            if (!res.body.isOK) {
                throw Error(`getStoneUniRefDetails Error: ${res.body.message}`);
            }

            return res.body.details;
        })
    )
}

function writeStoneRefDetails(details: StoneRefDetail[], file: string) {
    const rows = details.map((detail, index) => {
        return {
            No: index + 1,
            Start: formatTime(new Date(detail.start)),
            End: formatTime(new Date(detail.end)),
            'Duration(hour)': (detail.duration / 3600).toFixed(3),
            from: detail.from,
            to: detail.to,
            Points: detail.sendPoints
        }
    });

    const total: SldDecimal = rows.map(one => SldDecimal.fromNumeric(one.Points, 18)).reduce((acc, cur) => acc.add(cur), SldDecimal.ZERO);
    rows.push({Points: total.toNumeric(true)} as any);

    const ws = fs.createWriteStream(file);
    fastcsv.write(rows, {headers: true})
        .pipe(ws)
        .on('finish', () => {
            console.log('Write2 to CSV successfully!', file);
        })
        .on('error', err => {
            console.error(err);
        });
}


getBeraPointsRefDetails('0x2E5745f3136E1023b7db402f2f20d59ECe802F4A');