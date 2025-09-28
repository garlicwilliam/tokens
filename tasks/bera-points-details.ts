import {httpGet} from "../utils/http";
import {concatMap, finalize, map} from "rxjs/operators";
import {AsyncSubject, from, Observable, zip} from "rxjs";
import fs from "fs";
import * as fastcsv from "fast-csv";
import {round} from "lodash";
import {SldDecimal} from "../utils/decimal";
import {hexToInt} from "./hex";

type StoneUniDetail = {
    "idx": number,
    "start": string,
    "end": string,
    "duration": number,
    "position": string,
    "isActive": 1,
    "balance": string,
    "balanceNarrow": string,
    "tickLower": number,
    "tickUpper": number,
    "curTick": number,
    "pointsNormalX1": string,
    "pointsNarrowX1": string,
    "pointsInactiveX1": string,
    "pointsFinal": string,
    "pointsExt": string,
    "pointsTotal": string
}

type StoneLpDetail = {
    "idx": number,
    "start": string
    "end": string,
    "duration": number,
    "balance": string,
    "pointsX1": string,
    "pointsFinal": string,
    "pointsExt": string,
    "pointsTotal": string,
}


export function getBeraPointsDetails(address: string): Observable<any> {
    address = address.toLowerCase();
    const stoneLpFile = `./data/bera_points/bera_points_stone_lp_${address}.csv`;
    const stoneUniFile = `./data/bera_points/bera_points_stone_uni_${address}.csv`;
    const stoneMorpho = `/data/bera_points/bera_points_stone_morpho_${address}.csv`;
    const sbtcLpFile = `./data/bera_points/bera_points_sbtc_lp_${address}.csv`;
    const sbtcUniFile = `./data/bera_points/bera_points_sbtc_uni_${address}.csv`;

    const rs1 = new AsyncSubject<boolean>();
    const rs2 = new AsyncSubject<boolean>();
    const rs3 = new AsyncSubject<boolean>();
    const rs4 = new AsyncSubject<boolean>();
    const rs5 = new AsyncSubject<boolean>();

    getStoneLpDetails(address).pipe(
        finalize(() => {
            rs1.next(true);
            rs1.complete();
        })
    ).subscribe({
        next: details => {
            writeLpDetails(details, stoneLpFile);
        },
        error: (err) => {
            console.log(err);
        },
    });

    getStoneUniDetails(address).pipe(finalize(() => {
        rs2.next(true);
        rs2.complete()
    })).subscribe({
        next: details => {
            writeUniDetails(details, stoneUniFile);
        },
        error: (err) => {
            console.log(err);
        }
    })

    getStoneMorphoDetails(address).pipe(finalize(() => {
        rs3.next(true);
        rs3.complete();
    })).subscribe({
        next: details => {
            writeLpDetails(details, stoneMorpho);
        },
        error: err => {
            console.log(err)
        }
    })

    getSBtcLpDetails(address).pipe(finalize(() => {
        rs4.next(true);
        rs4.complete();
    })).subscribe({
        next: (details) => writeLpDetails2(details, sbtcLpFile),
        error: err => {
            console.log(err)
        }
    })

    getSBtcUniDetails(address).pipe(finalize(() => {
        rs5.next(true);
        rs5.complete();
    })).subscribe({
        next: (details) => writeUniDetails2(details, sbtcUniFile),
        error: err => {
            console.log(err)
        }
    })

    return zip(rs1, rs2, rs3, rs4, rs5).pipe(map(([f1, f2, f3, f4, f5]) => {
        return f1 && f2 && f3 && f4 && f5;
    }));
}

function getStoneLpDetails(address: string): Observable<StoneLpDetail[]> {
    const url = `http://points.stakestone.io/bera_points/detail/${address}/shot_bera_stone`;
    return httpGet(url).pipe(
        map(res => {
            if (res.status !== 200) {
                throw Error(`getStoneLpDetails Error: ${res.status}`);
            }

            if (!res.body.isOK) {
                throw Error(`getStoneLpDetails Error: ${res.body.message}`);
            }

            return res.body.details;
        })
    )
}

function getStoneUniDetails(address: string): Observable<StoneUniDetail[]> {
    const url: string = `http://points.stakestone.io/bera_points/detail/${address}/shot_bera_stone_uni`;
    return httpGet(url).pipe(
        map(res => {
            if (res.status !== 200) {
                throw Error(`getStoneUniDetails Error: ${res.status}`);
            }

            if (!res.body.isOK) {
                throw Error(`getStoneUniDetails Error: ${res.body.message}`);
            }

            return res.body.details;
        })
    )
}

function getStoneMorphoDetails(address: string): Observable<StoneLpDetail[]> {
    const url = `http://points.stakestone.io/bera_points/detail/${address}/shot_bera_stone_morpho`;
    return httpGet(url).pipe(
        map(res => {
            if (res.status !== 200) {
                throw Error(`getStoneLpDetails Error: ${res.status}`);
            }

            if (!res.body.isOK) {
                throw Error(`getStoneLpDetails Error: ${res.body.message}`);
            }

            return res.body.details;
        })
    )
}

function getSBtcLpDetails(address: string): Observable<StoneLpDetail[]> {
    const url = `http://points.stakestone.io/bera_points/detail/${address}/shot_bera_sbtc`;
    return httpGet(url).pipe(
        map(res => {
            if (res.status !== 200) {
                throw Error(`getStoneLpDetails Error: ${res.status}`);
            }

            if (!res.body.isOK) {
                throw Error(`getStoneLpDetails Error: ${res.body.message}`);
            }

            return res.body.details;
        })
    )
}

function getSBtcUniDetails(address: string):Observable<StoneUniDetail[]> {
    const url: string = `http://points.stakestone.io/bera_points/detail/${address}/shot_bera_sbtc_uni`;
    return httpGet(url).pipe(
        map(res => {
            if (res.status !== 200) {
                throw Error(`getStoneUniDetails Error: ${res.status}`);
            }

            if (!res.body.isOK) {
                throw Error(`getStoneUniDetails Error: ${res.body.message}`);
            }

            return res.body.details;
        })
    )
}


function writeLpDetails(details: StoneLpDetail[], file: string): void {
    const rows = details.map((one, index) => {
        return {
            "No": index + 1,
            Start: one.start,
            End: one.end,
            'Duration(hour)': (one.duration / 3600).toFixed(3),
            'Amount(beraSTONE)': one.balance,
            'Points(include ext 10% boost)': one.pointsTotal
        }
    })


    const total = rows
        .map(one => SldDecimal.fromNumeric(one['Points(include ext 10% boost)'], 18))
        .reduce((acc, cur) => acc.add(cur), SldDecimal.ZERO);

    rows.push({'Points(include ext 10% boost)': total.toNumeric(true)} as any);

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

function writeUniDetails(details: StoneUniDetail[], file: string): void {
    const rows = details.map((one, index) => {
        return {
            "No": index + 1,
            PositionID: hexToInt(one.position),
            Start: one.start,
            End: one.end,
            'Duration(hour)': (one.duration / 3600).toFixed(3),
            TickLower: one.tickLower,
            TickUpper: one.tickUpper,
            CurTick: one.curTick,
            Active: Boolean(one.isActive),
            'Amount(beraSTONE)': one.balance,
            'Amount(beraSTONE in Concentrated Position)': one.balanceNarrow,
            'Points(include ext 10% boost)': one.pointsTotal
        }
    })

    const total = rows
        .map(one => SldDecimal.fromNumeric(one['Points(include ext 10% boost)'], 18))
        .reduce((acc, cur) => acc.add(cur), SldDecimal.ZERO);

    rows.push({'Points(include ext 10% boost)': total.toNumeric(true)} as any);

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

function writeUniDetails2(details: StoneUniDetail[], file: string): void {
    const rows = details.map((one, index) => {
        return {
            "No": index + 1,
            PositionID: hexToInt(one.position),
            Start: one.start,
            End: one.end,
            'Duration(hour)': (one.duration / 3600).toFixed(3),
            TickLower: one.tickLower,
            TickUpper: one.tickUpper,
            CurTick: one.curTick,
            Active: Boolean(one.isActive),
            'Amount(beraSBTC)': one.balance,
            'Points(include ext 10% boost)': one.pointsTotal
        }
    })

    const total = rows
        .map(one => SldDecimal.fromNumeric(one['Points(include ext 10% boost)'], 18))
        .reduce((acc, cur) => acc.add(cur), SldDecimal.ZERO);

    rows.push({'Points(include ext 10% boost)': total.toNumeric(true)} as any);

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

function writeLpDetails2(details: StoneLpDetail[], file: string): void {
    const rows = details.map((one, index) => {
        return {
            "No": index + 1,
            Start: one.start,
            End: one.end,
            'Duration(hour)': (one.duration / 3600).toFixed(3),
            'Amount(beraSBTC)': one.balance,
            'Points(include ext 10% boost)': one.pointsTotal
        }
    })


    const total = rows
        .map(one => SldDecimal.fromNumeric(one['Points(include ext 10% boost)'], 18))
        .reduce((acc, cur) => acc.add(cur), SldDecimal.ZERO);

    rows.push({'Points(include ext 10% boost)': total.toNumeric(true)} as any);

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

// const list = [
//     "0xc63fd14e6c2633c96f4f526cb38d925b12435b98",
//     "0x4360f119b59a676f8aa47b38e051a4bcbabd8812",
//     "0xc12f8390001e576228f491b321c8b13f628f815b",
//     "0x11b52a1578a578dc7d587964792bf9dc65855dec",
//     "0x0db4246453ca1f39665da24a838c3b71d845ee35",
//     "0x3d2138b01315b111461480045fd0672ac63462b8",
//     "0xc8fbe6af20979178ee980ed342d2d8e54b801d37",
//     "0x8c729a99524ac8887ff1e36ed24aa79c0041571c",
//     "0x390a560989d13e282f9641792b67231a112d19da",
//     "0x1e2f8c47758d82e4c7e8d10610501b49bd9e09c0",
//     "0x30ddd1995990d1c84e362f9eae28225cb0660343",
//     "0x6343fb63f0805d5e4b3125b69f1a5eb4b822dbe6",
//     "0xcb0bf43f9da8fbdbffc594b6dd875b15683ac631",
//     "0x49919874a004a729abf2b3fd8aa8da1f472836d8",
//     "0xccd9df818d77d500126256dafc983931592ca1d8",
//     "0x5baf2f63efe3c15c96317f32370a634274b50ad4",
//     "0x545f78a51fd98a6bc1e556341200a51236b6d93c",
//     "0x0d768db6e3ccee2d5f7ba585e7f887c38645e079",
//     "0x7220418635e7a2dfafc0e2fcf825779127ef6c64",
//     "0x5bacdc3cf6906f58128a2d6a2d22c1f0bd4d06f2",
//     "0xfaaa79aa8f0e97fe64923ff402790cce9d9be119",
//     "0xf145b0ba98710b72ee4b9210b382766f60beea5e",
//     "0xcda07bccbdb40b86fa58cd33218e44f2fa51c1f5",
//     "0x75d0d0ae529783d9c335d9b73129f7e3435184c0",
//     "0xb7789b2f17fb004acb451b4a0adbc5f17ce913d5",
//     "0x59a61f89ea7ddf3e77179d4a19462f8cc27e354c",
//     "0x003826505e49d383a1b2389eb3ab4392b1579ea6",
//     "0x97dcf6891d4d1b07ca249eb461c28ddb392cfd9b",
//     "0xf221d4a60e5610c74b017ecb3eaef32ca61730fe",
//     "0x867a4c2da64994c861475c7bdefae69b5e9806bc",
//     "0xe0d0527ffc6d7d64a03c9509911323d4d15e5966",
//     "0xa8d946ec4192a6e9e0e927f46d7332f91b45f386",
//     "0x3915a18ac95d6d8504916df30391ece34ba4508d",
//     "0xf56a0ae3c201b00965f4ad89c97ebc5dfedf0ea2",
//     "0x74f6f2cdc17a4fadeff490c7f6ac4f8e9cbb31be",
//     "0x335c57478a446c26609402544088213d50d7d6d3",
//     "0xf0f6e342a0ca63ac718b9c4ccea197d531bed09f",
//     "0xe5e0a1d4a5a396ab0c92d187d2ec11c79cc628c7",
//     "0xd55c8d82963698da7923e01c43d3e404b8e47377"
// ]
//
// from(list).pipe(
//     concatMap((addr) => {
//         return getBeraPointsDetails(addr)
//     })
// ).subscribe({
//
// })

getBeraPointsDetails('0x44eE5131A0fE22a9c330866410a087Cb01d4cdA4')