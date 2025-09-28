import { readCsv, writeCsv } from "../common/csv";
import { map } from "rxjs/operators";
import { SldDecimal, SldDecPercent } from "../../utils/decimal";
import { Observable, switchMap, tap, zip } from "rxjs";

type WaveRow = {
  address: string;
  pointsEarn: string;
  pointsRef: string;
  pointsTotal: string;
  percent: string;
  inviter: string;
};

type WaveRow2 = WaveRow & {
  newPoints: SldDecimal;
  new_STO: SldDecimal;
  TurtlePoints: SldDecimal;
  Turtle_STO: SldDecimal;
};

type WaveRow3 = WaveRow2 & {
  BinancePoints: SldDecimal;
  Binance_STO: SldDecimal;
};

function readTurtleUsersWave(file: string): Observable<Set<string>> {
  return readCsv(file).pipe(
    map((rows: { address: string; isValid: string }[]) => {
      return rows
        .filter((one) => one.isValid === "true")
        .map((one) => one.address);
    }),
    map((addresses: string[]) => {
      return new Set<string>(addresses);
    }),
  );
}

function readBinanceUsers(file: string): Observable<Set<string>> {
  type BinanceRow = {
    address: string;
    pointsEarn: string;
    inviterAddress: string;
    pointsRef: string;
  };

  return readCsv(file).pipe(
    map((rows: BinanceRow[]) => {
      return rows
        .filter((one) => one.inviterAddress === "")
        .map((one) => one.address);
    }),
    map((addresses: string[]) => {
      return new Set<string>(addresses);
    }),
  );
}

function dealWithWave1File(
  file: string,
  turtleUsers: Set<string>,
  out: string,
) {
  let sum: WaveRow | null = null;
  readCsv(file)
    .pipe(
      map((rows: WaveRow[]) => {
        sum = rows[rows.length - 1];
        return rows.slice(0, rows.length - 1);
      }),
      map((rows: WaveRow[]) => {
        const refRate = SldDecPercent.genPercent("25");
        const turRate = SldDecPercent.genPercent("20");

        const e18: bigint = SldDecimal.fromNumeric("1", 18).toOrigin();
        const totalPot = SldDecimal.fromNumeric("1898123163.01832", 18);
        const totalSTO = SldDecimal.fromNumeric("30000000", 18);
        const pointSTO: SldDecimal = totalSTO.mul(e18).div(totalPot.toOrigin());

        console.log("point sto", pointSTO.toNumeric());

        return rows.map((one: WaveRow) => {
          const earned: SldDecimal = toDecimal(one.pointsEarn);
          const canNew: boolean = earned.gtZero() && one.inviter !== "Y";
          const newPoints = canNew ? refRate.applyTo(earned) : SldDecimal.ZERO;
          const new_STO = canNew
            ? pointSTO.mul(newPoints.toOrigin()).div(e18)
            : SldDecimal.ZERO;

          const turtlePoints =
            canNew && turtleUsers.has(one.address)
              ? turRate.applyTo(earned)
              : SldDecimal.ZERO;
          const turtleSto = pointSTO.mul(turtlePoints.toOrigin()).div(e18);

          return {
            ...one,
            newPoints,
            new_STO,
            TurtlePoints: turtlePoints,
            Turtle_STO: turtleSto,
          };
        });
      }),
      map((rows: WaveRow2[]) => {
        if (sum) {
          const total: WaveRow2 = {
            ...sum,
            ...{
              newPoints: SldDecimal.ZERO,
              new_STO: SldDecimal.ZERO,
              TurtlePoints: SldDecimal.ZERO,
              Turtle_STO: SldDecimal.ZERO,
            },
          };

          rows.forEach((one) => {
            total.address = "SUM";
            total.newPoints = total.newPoints.add(one.newPoints);
            total.new_STO = total.new_STO.add(one.new_STO);
            total.TurtlePoints = total.TurtlePoints.add(one.TurtlePoints);
            total.Turtle_STO = total.Turtle_STO.add(one.Turtle_STO);
          });
          rows.push(total);
        }

        return rows.map((one) => {
          return {
            address: one.address,
            pointsEarn: one.pointsEarn,
            pointsRef: one.pointsRef,
            pointsTotal: one.pointsTotal,
            percent: one.percent,
            inviter: one.inviter,
            newPoints: one.newPoints.toNumeric(true),
            new_STO: one.new_STO.toNumeric(true),
            TurtlePoints: one.TurtlePoints.toNumeric(true),
            Turtle_STO: one.Turtle_STO.toNumeric(true),
          };
        });
      }),
    )
    .subscribe({
      next: (rows) => {
        writeCsv(out, rows);
      },
    });
}

function dealWithWaveBeraFile(
  file: string,
  turtleUsers: Set<string>,
  binanceUsers: Set<string>,
  out: string,
) {
  let sum: WaveRow | null = null;
  readCsv(file)
    .pipe(
      map((rows: WaveRow[]) => {
        sum = rows[rows.length - 1];
        return rows.slice(0, rows.length - 1);
      }),
      map((rows: WaveRow[]) => {
        const refRate = SldDecPercent.genPercent("20");
        const turRate = SldDecPercent.genPercent("10");
        const binRate = SldDecPercent.genPercent("15");
        const e18: bigint = SldDecimal.fromNumeric("1", 18).toOrigin();

        const totalPot = SldDecimal.fromNumeric("1898123163.01832", 18);
        const totalSTO = SldDecimal.fromNumeric("30000000", 18);
        const pointSTO: SldDecimal = totalSTO.mul(e18).div(totalPot.toOrigin());
        //

        return rows.map((one: WaveRow) => {
          const earned: SldDecimal = toDecimal(one.pointsEarn);
          const canNew: boolean = earned.gtZero() && one.inviter !== "Y";
          const newPoints = canNew ? refRate.applyTo(earned) : SldDecimal.ZERO;
          const new_STO = canNew
            ? pointSTO.mul(newPoints.toOrigin()).div(e18)
            : SldDecimal.ZERO;

          const turtlePoints =
            canNew && turtleUsers.has(one.address)
              ? turRate.applyTo(earned)
              : SldDecimal.ZERO;
          const turtleSto = pointSTO.mul(turtlePoints.toOrigin()).div(e18);

          const binancePoints =
            canNew && binanceUsers.has(one.address)
              ? binRate.applyTo(earned)
              : SldDecimal.ZERO;
          const binanceSto = pointSTO.mul(binancePoints.toOrigin()).div(e18);

          return {
            ...one,
            newPoints,
            new_STO,
            TurtlePoints: turtlePoints,
            Turtle_STO: turtleSto,

            BinancePoints: binancePoints,
            Binance_STO: binanceSto,
          };
        });
      }),
      map((rows: WaveRow3[]) => {
        if (sum) {
          const total: WaveRow3 = {
            ...sum,
            ...{
              newPoints: SldDecimal.ZERO,
              new_STO: SldDecimal.ZERO,
              TurtlePoints: SldDecimal.ZERO,
              Turtle_STO: SldDecimal.ZERO,
              BinancePoints: SldDecimal.ZERO,
              Binance_STO: SldDecimal.ZERO,
            },
          };

          rows.forEach((one) => {
            total.address = "SUM";
            total.newPoints = total.newPoints.add(one.newPoints);
            total.new_STO = total.new_STO.add(one.new_STO);
            total.TurtlePoints = total.TurtlePoints.add(one.TurtlePoints);
            total.Turtle_STO = total.Turtle_STO.add(one.Turtle_STO);
            total.BinancePoints = total.BinancePoints.add(one.BinancePoints);
            total.Binance_STO = total.Binance_STO.add(one.Binance_STO);
          });
          rows.push(total);
        }

        return rows.map((one) => {
          return {
            address: one.address,
            pointsEarn: one.pointsEarn,
            pointsRef: one.pointsRef,
            pointsTotal: one.pointsTotal,
            percent: one.percent,
            inviter: one.inviter,
            newPoints: one.newPoints.toNumeric(true),
            new_STO: one.new_STO.toNumeric(true),
            TurtlePoints: one.TurtlePoints.toNumeric(true),
            Turtle_STO: one.Turtle_STO.toNumeric(true),
            BinancePoints: one.BinancePoints.toNumeric(true),
            Binance_STO: one.Binance_STO.toNumeric(true),
          };
        });
      }),
    )
    .subscribe({
      next: (rows) => {
        writeCsv(out, rows);
      },
    });
}

function dealWithWaveBtcFile(file: string, out: string) {
  readCsv(file).pipe(map((rows: WaveRow[]) => {

  }));
}

const wave1Input = "./data/wave_points/wave1_points.csv";
const wave1Out = "./data/merge_points/wave1_ref.csv";
const wave1TurtleInput = "./data/wave_points/turtle_wave1_points.csv";
//
const waveBeraInput = "./data/wave_points/bera_points.csv";
const waveBeraOut = "./data/merge_points/bera_ref.csv";
const waveBeraTurtleInput = "./data/wave_points/turtle_bera_points.csv";
const waveBeraBinanceInput = "./data/wave_points/binance_bera_points.csv";

function toDecimal(numStr: string) {
  return SldDecimal.fromNumeric(numStr, 18);
}

function dealWave1() {
  readTurtleUsersWave(wave1TurtleInput)
    .pipe(
      tap((tur) => {
        dealWithWave1File(wave1Input, tur, wave1Out);
      }),
    )
    .subscribe();
}

function dealWaveBera() {
  zip(
    readTurtleUsersWave(waveBeraTurtleInput),
    readBinanceUsers(waveBeraBinanceInput),
  )
    .pipe(
      tap(([turtle, binance]) => {
        dealWithWaveBeraFile(waveBeraInput, turtle, binance, waveBeraOut);
      }),
    )
    .subscribe();
}

function dealWaveBtc() {}

// dealWave1();

dealWaveBera();
