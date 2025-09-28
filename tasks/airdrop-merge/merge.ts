import { readCsv, writeCsv } from "../common/csv";
import { Observable, switchMap, tap, zip } from "rxjs";
import { add } from "lodash";
import { map } from "rxjs/operators";
import { SldDecimal, SldDecPercent } from "../../utils/decimal";
import {isValidAddress} from "../../utils/address";

type MergeRow = {
  Address: string;
  //
  Wave1_PointsEarn: SldDecimal;
  Wave1_PointsRef: SldDecimal;
  Wave1_PointsTotal: SldDecimal;
  Wave1_STO: SldDecimal;
  //
  STONE_BTC_PointsEarn: SldDecimal;
  STONE_BTC_PointsRef: SldDecimal;
  STONE_BTC_PointsTotal: SldDecimal;
  STONE_BTC_STO: SldDecimal;
  //
  STONE_BNB_PointsEarn: SldDecimal;
  STONE_BNB_PointsRef: SldDecimal;
  STONE_BNB_PointsTotal: SldDecimal;
  STONE_BNB_STO: SldDecimal;
  //
  RNP_Points: SldDecimal;
  RNP_primary_STO: SldDecimal;
  RNP_final_STO: SldDecimal;
  //
  BeraWave_PointsEarn: SldDecimal;
  BeraWave_PointsRef: SldDecimal;
  BeraWave_PointsTotal: SldDecimal;
  BeraWave_STO: SldDecimal;
  //
  Welfare_STO: SldDecimal;
  //
  MantaNewParadigm_Size: SldDecimal;
  MantaNewParadigm_Cross: Boolean;
  MantaNewParadigm_STO: SldDecimal;
  //
  GNFT_Mainnet_STO: SldDecimal;
  GNFT_Manta_STO: SldDecimal;
  //
  Merlin_Before221_STO: SldDecimal;
  //
  Alliance_Level1_STO: SldDecimal;
  Alliance_Level2_STO: SldDecimal;
  //
  CStoneMinter_STO: SldDecimal;
  //
  Bob_Amount: SldDecimal;
  Bob_STO: SldDecimal;
  //
  Special_STO: SldDecimal;
  //
  Total_STO: SldDecimal;
  Total_Final_STO: SldDecimal;
  // delta
  DeltaPlus: SldDecimal;
  DeltaMinus: SldDecimal;
};
type WriteRow = {
  Address: string;
  //
  Wave1_PointsEarn: string;
  Wave1_PointsRef: string;
  Wave1_PointsTotal: string;
  Wave1_STO: string;
  //
  STONE_BTC_PointsEarn: string;
  STONE_BTC_PointsRef: string;
  STONE_BTC_PointsTotal: string;
  STONE_BTC_STO: string;
  //
  STONE_BNB_PointsEarn: string;
  STONE_BNB_PointsRef: string;
  STONE_BNB_PointsTotal: string;
  STONE_BNB_STO: string;
  //
  RNP_Points: string;
  RNP_primary_STO: string;
  RNP_final_STO: string;
  //
  BeraWave_PointsEarn: string;
  BeraWave_PointsRef: string;
  BeraWave_PointsTotal: string;
  BeraWave_STO: string;
  //
  Welfare_STO: string;
  //
  GNFT_Mainnet_STO: string;
  GNFT_Manta_STO: string;
  //
  Merlin_Before221_STO: string;
  //
  Alliance_Level1_STO: string;
  Alliance_Level2_STO: string;
  //
  MantaNewParadigm_Size: string;
  MantaNewParadigm_Cross: string;
  MantaNewParadigm_STO: string;
  //
  CStoneMinter_STO: string;
  //
  Bob_Amount: string;
  Bob_STO: string;
  //
  Special_STO: string;
  //
  Total_STO: string;
  Total_Final_STO: string;
  //
  DeltaPlus: string;
  DeltaMinus: string;
};
type WriteRowSto = {
  Address: string;
  Wave1_STO: string;
  STONE_BTC_STO: string;
  STONE_BNB_STO: string;
  RNP_primary_STO: string;
  RNP_final_STO: string;
  BeraWave_STO: string;
  Welfare_STO: string;
  MantaNewParadigm_STO: string;
  GNFT_Mainnet_STO: string;
  GNFT_Manta_STO: string;
  Merlin_Before221_STO: string;
  Alliance_Level1_STO: string;
  Alliance_Level2_STO: string;
  CStoneMinter_STO: string;
  //
  Total_STO: string;
  Total_Final_STO: string;
  //
  DeltaPlus: string;
  DeltaMinus: string;
};

type WavePrefix = "Wave1" | "STONE_BTC" | "STONE_BNB" | "BeraWave";
type WaveStoRowKeys<T extends WavePrefix> =
  | `${T}_PointsEarn`
  | `${T}_PointsRef`
  | `${T}_PointsTotal`
  | `${T}_STO`;
type WaveStoRow<T extends WavePrefix> = { address: string } & {
  [key in WaveStoRowKeys<T>]: SldDecimal;
};
type MantaStoRow = {
  address: string;
  RNP_Points: SldDecimal;
  RNP_primary_STO: SldDecimal;
  RNP_final_STO: SldDecimal;
};
type WelfareStoRow = {
  address: string;
  Welfare_STO: SldDecimal;
};
type MantaNewStoRow = {
  address: string;
  MantaNewParadigm_Size: SldDecimal;
  MantaNewParadigm_Cross: Boolean;
  MantaNewParadigm_STO: SldDecimal;
};
type GNftMainnetStoRow = {
  address: string;
  GNFT_Mainnet_STO: SldDecimal;
};
type GNftMantaStoRow = {
  address: string;
  GNFT_Manta_STO: SldDecimal;
};
type Before221StoRow = {
  address: string;
  Merlin_Before221_STO: SldDecimal;
};
type Alliance1StoRow = {
  address: string;
  Alliance_Level1_STO: SldDecimal;
};
type Alliance2StoRow = {
  address: string;
  Alliance_Level2_STO: SldDecimal;
};
type CStoneMinterStoRow = {
  address: string;
  CStoneMinter_STO: SldDecimal;
};
type BobStoRow = {
  address: string;
  Bob_Amount: SldDecimal;
  Bob_STO: SldDecimal;
};

type WaveRow = {
  address: string;
  pointsEarn: string;
  pointsRef: string;
  pointsTotal: string;
};
type MantaRow = {
  address: string;
  RNP_Points: string;
  RNP_primary_STO: string;
  RNP_final_STO: string;
};
type WelfareRow = {
  Address: string;
  Total: string;
};
type MantaNewRow = {
  Address: string;
  Amount: string;
};
type GNftRow = {
  Address: string;
};
type Before221Row = {
  Address: string;
};
type CStoneMinterRow = {
  Address: string;
  mint_cSTONE: "T" | "F";
};
type BobRow = {
  Address: string;
  Total_Amount: string;
};

const mergeRowMap = new Map<string, MergeRow>();

function toSldDecimal(numStr: string): SldDecimal {
  return SldDecimal.fromNumeric(numStr, 18);
}
function emptyRow(address: string): MergeRow {
  return {
    Address: address,
    //
    Wave1_PointsEarn: SldDecimal.ZERO,
    Wave1_PointsRef: SldDecimal.ZERO,
    Wave1_PointsTotal: SldDecimal.ZERO,
    Wave1_STO: SldDecimal.ZERO,
    //
    STONE_BTC_PointsEarn: SldDecimal.ZERO,
    STONE_BTC_PointsRef: SldDecimal.ZERO,
    STONE_BTC_PointsTotal: SldDecimal.ZERO,
    STONE_BTC_STO: SldDecimal.ZERO,
    //
    STONE_BNB_PointsEarn: SldDecimal.ZERO,
    STONE_BNB_PointsRef: SldDecimal.ZERO,
    STONE_BNB_PointsTotal: SldDecimal.ZERO,
    STONE_BNB_STO: SldDecimal.ZERO,
    //
    RNP_Points: SldDecimal.ZERO,
    RNP_primary_STO: SldDecimal.ZERO,
    RNP_final_STO: SldDecimal.ZERO,
    //
    BeraWave_PointsEarn: SldDecimal.ZERO,
    BeraWave_PointsRef: SldDecimal.ZERO,
    BeraWave_PointsTotal: SldDecimal.ZERO,
    BeraWave_STO: SldDecimal.ZERO,
    //
    Welfare_STO: SldDecimal.ZERO,
    //
    MantaNewParadigm_Size: SldDecimal.ZERO,
    MantaNewParadigm_Cross: false,
    MantaNewParadigm_STO: SldDecimal.ZERO,
    //
    GNFT_Mainnet_STO: SldDecimal.ZERO,
    GNFT_Manta_STO: SldDecimal.ZERO,
    //
    Merlin_Before221_STO: SldDecimal.ZERO,
    //
    Alliance_Level1_STO: SldDecimal.ZERO,
    Alliance_Level2_STO: SldDecimal.ZERO,
    //
    CStoneMinter_STO: SldDecimal.ZERO,
    //
    Bob_Amount: SldDecimal.ZERO,
    Bob_STO: SldDecimal.ZERO,
    //
    Special_STO: SldDecimal.ZERO,
    //
    Total_STO: SldDecimal.ZERO,
    Total_Final_STO: SldDecimal.ZERO,
    //
    // delta
    DeltaPlus: SldDecimal.ZERO,
    DeltaMinus: SldDecimal.ZERO,
  };
}
function getRow(address: string, note?: string): MergeRow {



  if (!mergeRowMap.has(address)) {
    mergeRowMap.set(address, emptyRow(address));
  }



  return mergeRowMap.get(address)!;
}

function dealTotalWelfare(rows: MergeRow[]) {
  let { tops, bottoms } = divideTopUsers3(rows);

  tops = minusTops3(tops);
  tops = fillWelfare(tops);
  bottoms = fillWelfare(bottoms);

  rows = [...tops, ...bottoms];

  return rows;
}

function divideTopUsers3(rows: MergeRow[]) {
  const end: number = rows.findIndex((one: MergeRow) =>
    one.Total_STO.lte(toSldDecimal("9000")),
  );

  const tops = rows.slice(0, end);
  const bottoms = rows.slice(end);
  return { tops, bottoms };
}

function minusTops3(rows: MergeRow[]): MergeRow[] {
  const takeRate = SldDecPercent.genPercent("88.9");
  const min = toSldDecimal("9000");
  rows.forEach((one, index) => {
    if (
      one.Address ===
      "0xec861ed6d72eeaa20e5bc85881a2750206384f1d34b281555f41da75221b1b8b"
    ) {
      return;
    }

    const plusIndex: SldDecimal = toSldDecimal(
      (rows.length - index).toString(),
    ).mul(10n);
    const minAmount = min.add(plusIndex);

    one.Total_Final_STO = one.Total_STO;
    one.Total_Final_STO = takeRate.applyTo(one.Total_Final_STO);
    if (one.Total_Final_STO.lt(minAmount)) {
      one.Total_Final_STO = minAmount;
    }
  });

  return rows;
}

function fillWelfare(rows: MergeRow[]): MergeRow[] {
  const minSTO20: SldDecimal = toSldDecimal("20");
  const minSTO50: SldDecimal = toSldDecimal("50");

  rows.forEach((one: MergeRow) => {
    if (one.Total_Final_STO.isZero()) {
      one.Total_Final_STO = one.Total_STO;
    }

    if (one.Total_Final_STO.lte(minSTO20)) {
      one.Total_Final_STO = minSTO20;
    } else if (
      one.Total_Final_STO.gt(minSTO20) &&
      one.Total_Final_STO.lt(minSTO50)
    ) {
      one.Total_Final_STO = minSTO50;
    }
  });

  return rows;
}

function writeMergedPoints() {
  const addresses = mergeRowMap.keys();

  let rows: MergeRow[] = Array.from(addresses)
    .map((address) => {
      return mergeRowMap.get(address)!;
    })
    .map((one) => {
      // 加和个人总数
      one.Total_STO = one.Wave1_STO.add(one.STONE_BTC_STO)
        .add(one.STONE_BNB_STO)
        .add(one.RNP_final_STO)
        .add(one.BeraWave_STO)
        .add(one.Welfare_STO)
        .add(one.MantaNewParadigm_STO)
        .add(one.GNFT_Mainnet_STO)
        .add(one.GNFT_Manta_STO)
        .add(one.Merlin_Before221_STO)
        .add(one.Alliance_Level1_STO)
        .add(one.Alliance_Level2_STO)
        .add(one.CStoneMinter_STO)
        .add(one.Bob_STO)
        .add(one.Special_STO);

      return one;
    })
    .sort((a, b) => {
      if (a.Total_STO.eq(b.Total_STO)) {
        if (
          a.MantaNewParadigm_Size.isZero() ||
          b.MantaNewParadigm_Size.isZero()
        ) {
          return b.MantaNewParadigm_Size.isZero() ? -1 : 1;
        } else
          return a.MantaNewParadigm_Size.lte(b.MantaNewParadigm_Size) ? -1 : 1;
      }

      return a.Total_STO.lte(b.Total_STO) ? -1 : 1;
    })
    .filter((one) => {
      return one.Total_STO.gtZero();
    });

  console.log("merged map", rows.length);
  //
  rows = rows.reverse();
  // 内部总低保
  rows = dealTotalWelfare(rows);
  //
  rows.reverse();
  //
  rows.forEach((one) => {
    one.DeltaPlus = SldDecimal.max(
      one.Total_Final_STO.sub(one.Total_STO),
      SldDecimal.ZERO,
    );
    one.DeltaMinus = SldDecimal.max(
      one.Total_STO.sub(one.Total_Final_STO),
      SldDecimal.ZERO,
    );
  });
  // 提取地址
  const allAddresses: { Address: string }[] = rows.map((one) => {
    return {
      Address: one.Address,
    };
  });
  writeCsv("./data/wave_points/merged_addresses.csv", allAddresses);

  // 增加最后总计行
  const sum: MergeRow = emptyRow("Sum");
  rows.forEach((row) => {
    sum.Wave1_PointsEarn = sum.Wave1_PointsEarn.add(row.Wave1_PointsEarn);
    sum.Wave1_PointsRef = sum.Wave1_PointsRef.add(row.Wave1_PointsRef);
    sum.Wave1_PointsTotal = sum.Wave1_PointsTotal.add(row.Wave1_PointsTotal);
    sum.Wave1_STO = sum.Wave1_STO.add(row.Wave1_STO);
    //
    sum.STONE_BTC_PointsEarn = sum.STONE_BTC_PointsEarn.add(
      row.STONE_BTC_PointsEarn,
    );
    sum.STONE_BTC_PointsRef = sum.STONE_BTC_PointsRef.add(
      row.STONE_BTC_PointsRef,
    );
    sum.STONE_BTC_PointsTotal = sum.STONE_BTC_PointsTotal.add(
      row.STONE_BTC_PointsTotal,
    );
    sum.STONE_BTC_STO = sum.STONE_BTC_STO.add(row.STONE_BTC_STO);
    //
    sum.STONE_BNB_PointsEarn = sum.STONE_BNB_PointsEarn.add(
      row.STONE_BNB_PointsEarn,
    );
    sum.STONE_BNB_PointsRef = sum.STONE_BNB_PointsRef.add(
      row.STONE_BNB_PointsRef,
    );
    sum.STONE_BNB_PointsTotal = sum.STONE_BNB_PointsTotal.add(
      row.STONE_BNB_PointsTotal,
    );
    sum.STONE_BNB_STO = sum.STONE_BNB_STO.add(row.STONE_BNB_STO);
    //
    sum.RNP_Points = sum.RNP_Points.add(row.RNP_Points);
    sum.RNP_primary_STO = sum.RNP_primary_STO.add(row.RNP_primary_STO);
    sum.RNP_final_STO = sum.RNP_final_STO.add(row.RNP_final_STO);
    //
    sum.BeraWave_PointsEarn = sum.BeraWave_PointsEarn.add(
      row.BeraWave_PointsEarn,
    );
    sum.BeraWave_PointsRef = sum.BeraWave_PointsRef.add(row.BeraWave_PointsRef);
    sum.BeraWave_PointsTotal = sum.BeraWave_PointsTotal.add(
      row.BeraWave_PointsTotal,
    );
    sum.BeraWave_STO = sum.BeraWave_STO.add(row.BeraWave_STO);
    //
    sum.Welfare_STO = sum.Welfare_STO.add(row.Welfare_STO);
    //
    sum.MantaNewParadigm_STO = sum.MantaNewParadigm_STO.add(
      row.MantaNewParadigm_STO,
    );
    sum.GNFT_Manta_STO = sum.GNFT_Manta_STO.add(row.GNFT_Manta_STO);
    sum.GNFT_Mainnet_STO = sum.GNFT_Mainnet_STO.add(row.GNFT_Mainnet_STO);
    //
    sum.Merlin_Before221_STO = sum.Merlin_Before221_STO.add(
      row.Merlin_Before221_STO,
    );
    //
    sum.Alliance_Level1_STO = sum.Alliance_Level1_STO.add(
      row.Alliance_Level1_STO,
    );
    sum.Alliance_Level2_STO = sum.Alliance_Level2_STO.add(
      row.Alliance_Level2_STO,
    );
    //
    sum.CStoneMinter_STO = sum.CStoneMinter_STO.add(row.CStoneMinter_STO);
    sum.Bob_Amount = sum.Bob_Amount.add(row.Bob_Amount);
    sum.Bob_STO = sum.Bob_STO.add(row.Bob_STO);
    //
    sum.Special_STO = sum.Special_STO.add(row.Special_STO);
    //
    sum.Total_STO = sum.Total_STO.add(row.Total_STO);
    sum.Total_Final_STO = sum.Total_Final_STO.add(row.Total_Final_STO);
    //
    sum.DeltaPlus = sum.DeltaPlus.add(row.DeltaPlus);
    sum.DeltaMinus = sum.DeltaMinus.add(row.DeltaMinus);
  });
  //
  rows.push(sum);
  //
  const writeRows = rows.map((one: MergeRow): WriteRow => {
    return {
      Address: one.Address,
      //
      Wave1_PointsEarn: one.Wave1_PointsEarn.toNumeric(true),
      Wave1_PointsRef: one.Wave1_PointsRef.toNumeric(true),
      Wave1_PointsTotal: one.Wave1_PointsTotal.toNumeric(true),
      Wave1_STO: one.Wave1_STO.toNumeric(true),
      //
      STONE_BTC_PointsEarn: one.STONE_BTC_PointsEarn.toNumeric(true),
      STONE_BTC_PointsRef: one.STONE_BTC_PointsRef.toNumeric(true),
      STONE_BTC_PointsTotal: one.STONE_BTC_PointsTotal.toNumeric(true),
      STONE_BTC_STO: one.STONE_BTC_STO.toNumeric(true),
      //
      STONE_BNB_PointsEarn: one.STONE_BNB_PointsEarn.toNumeric(true),
      STONE_BNB_PointsRef: one.STONE_BNB_PointsRef.toNumeric(true),
      STONE_BNB_PointsTotal: one.STONE_BNB_PointsTotal.toNumeric(true),
      STONE_BNB_STO: one.STONE_BNB_STO.toNumeric(true),
      //
      RNP_Points: one.RNP_Points.toNumeric(true),
      RNP_primary_STO: one.RNP_primary_STO.toNumeric(true),
      RNP_final_STO: one.RNP_final_STO.toNumeric(true),
      //
      BeraWave_PointsEarn: one.BeraWave_PointsEarn.toNumeric(true),
      BeraWave_PointsRef: one.BeraWave_PointsRef.toNumeric(true),
      BeraWave_PointsTotal: one.BeraWave_PointsTotal.toNumeric(true),
      BeraWave_STO: one.BeraWave_STO.toNumeric(true),
      //
      Welfare_STO: one.Welfare_STO.toNumeric(true),
      //
      GNFT_Mainnet_STO: one.GNFT_Mainnet_STO.toNumeric(true),
      GNFT_Manta_STO: one.GNFT_Manta_STO.toNumeric(true),
      //
      Merlin_Before221_STO: one.Merlin_Before221_STO.toNumeric(true),
      //
      Alliance_Level1_STO: one.Alliance_Level1_STO.toNumeric(true),
      Alliance_Level2_STO: one.Alliance_Level2_STO.toNumeric(true),
      //
      MantaNewParadigm_Size: one.MantaNewParadigm_Size.isZero()
        ? "0"
        : one.MantaNewParadigm_Size.format({
            fix: 18,
            split: false,
          }),
      MantaNewParadigm_Cross: one.MantaNewParadigm_Size.gtZero()
        ? String(one.MantaNewParadigm_Cross)
        : "",
      MantaNewParadigm_STO: one.MantaNewParadigm_STO.toNumeric(true),
      //
      CStoneMinter_STO: one.CStoneMinter_STO.toNumeric(true),
      //
      Bob_Amount: one.Bob_Amount.toNumeric(true),
      Bob_STO: one.Bob_STO.toNumeric(true),
      //
      Special_STO: one.Special_STO.toNumeric(true),
      //
      Total_STO: one.Total_STO.toNumeric(true),
      Total_Final_STO: one.Total_Final_STO.toNumeric(true),
      // delta
      DeltaPlus: one.DeltaPlus.toNumeric(true),
      DeltaMinus: one.DeltaMinus.toNumeric(true),
    };
  });

  let writeRows2 = writeRows.map( one => {

    return {
      Address: one.Address,
      Total_Final_STO: SldDecimal.fromNumeric(one.Total_Final_STO, 18),
    }
  })

  writeRows2 =  writeRows2.slice(0, writeRows2.length -1)

 const no =  writeRows2.filter(one => !isValidAddress(one.Address))
console.log('no address', no);
  const addition = [
    ["0x5958556362Ed39F31fB3cE6f87E93436B7Fee359".toLowerCase() ,"18245"],
    ["0x561C65a77BF763FEEA80781477b09F9aD4b83087".toLowerCase() ,"16732"],
    ["0xCC27747c25e39cF7B1572C095291F96716Dd6888".toLowerCase() ,"19011.32"],
    ["0x94eE5bdEC229f0aD0339bb0B847334639C55Db14".toLowerCase() ,"15498"],
    ["0x6a1E8DD748d852afBb4F89768F037e7dFbbBAC53".toLowerCase() ,"12514"],
    ["0x8A528DC18b52A3935E596D6bAfE1938EDa9340c5".toLowerCase() ,"18012"],
  ]

  const addStos = addition.map(one => {
    return {
      Address: one[0],
      Total_Final_STO: one[1]
    }
  })




  writeCsv("./data/wave_points/merged_points.csv", writeRows);
  writeCsv("./data/wave_points/merged_points_s.csv", [...writeRows2, ...addStos]);
}
function readWavePoints<T extends WavePrefix>(
  file: string,
  prefix: T,
  allSTO: SldDecimal,
): Observable<any> {
  return readCsv(file).pipe(
    map((rows: WaveRow[]) => {
      const totalPoints: SldDecimal = SldDecimal.fromNumeric(
        rows[rows.length - 1]["pointsTotal"],
        18,
      );
      const userRows: WaveRow[] = rows.slice(0, rows.length - 1);

      const waveRows: WaveStoRow<T>[] = userRows.map(
        (one: WaveRow): WaveStoRow<T> => {
          const userPoints = SldDecimal.fromNumeric(one.pointsTotal, 18);
          return {
            address: one.address.toLowerCase(),
            [`${prefix}_PointsEarn`]: toSldDecimal(one.pointsEarn),
            [`${prefix}_PointsRef`]: toSldDecimal(one.pointsRef),
            [`${prefix}_PointsTotal`]: userPoints,
            [`${prefix}_STO`]: allSTO
              .mul(userPoints.toOrigin())
              .div(totalPoints.toOrigin()),
          } as WaveStoRow<T>;
        },
      );

      return waveRows;
    }),
    tap((rows: WaveStoRow<T>[]) => {
      console.log("rows", rows.length);
      rows.forEach((one: WaveStoRow<T>) => {
        const mergeRow = getRow(one.address, 'wave'+prefix);
        mergeRow[`${prefix}_PointsEarn`] = one[`${prefix}_PointsEarn`];
        mergeRow[`${prefix}_PointsRef`] = one[`${prefix}_PointsRef`];
        mergeRow[`${prefix}_PointsTotal`] = one[`${prefix}_PointsTotal`];
        mergeRow[`${prefix}_STO`] = one[`${prefix}_STO`];
      });
    }),
    map(() => {
      return mergeRowMap.size;
    }),
  );
}

function readMantaPoints(file: string): Observable<any> {
  return readCsv(file).pipe(
    map((rows: MantaRow[]) => {
      const stoRows = rows.map((one: MantaRow): MantaStoRow => {
        return {
          address: one.address.toLowerCase(),
          RNP_Points: toSldDecimal(one.RNP_Points),
          RNP_primary_STO: toSldDecimal(one.RNP_primary_STO),
          RNP_final_STO: toSldDecimal(one.RNP_final_STO),
        };
      });

      return stoRows;
    }),
    tap((stoRows: MantaStoRow[]) => {
      stoRows.forEach((one: MantaStoRow) => {
        const mergeRow: MergeRow = getRow(one.address, 'manta');
        mergeRow.RNP_Points = one.RNP_Points;
        mergeRow.RNP_primary_STO = one.RNP_primary_STO;
        mergeRow.RNP_final_STO = one.RNP_final_STO;
      });
    }),
    map(() => {
      return mergeRowMap.size;
    }),
  );
}
function readWelfareSto(file: string): Observable<any> {
  return readCsv(file).pipe(
    map((rows: WelfareRow[]) => {
      return rows.map((one: WelfareRow): WelfareStoRow => {
        return {
          address: one.Address.toLowerCase(),
          Welfare_STO: SldDecimal.fromNumeric(one.Total.toString(), 18),
        };
      });
    }),
    tap((stoRows: WelfareStoRow[]) => {
      stoRows.forEach((one: WelfareStoRow) => {
        const mergeRow: MergeRow = getRow(one.address, 'welflare');
        mergeRow.Welfare_STO = one.Welfare_STO;
      });
    }),
    map(() => {
      return mergeRowMap.size;
    }),
  );
}
function readMantaNewParadigm(file: string): Observable<any> {
  return readCsv(file).pipe(
    map((rows: MantaNewRow[]) => {
      return rows.map((one: MantaNewRow): MantaNewStoRow => {
        return {
          address: one.Address.toLowerCase(),
          MantaNewParadigm_Size: SldDecimal.fromNumeric(
            one.Amount.toString(),
            18,
          ),
          MantaNewParadigm_Cross: false,
          MantaNewParadigm_STO: SldDecimal.ZERO,
        };
      });
    }),
    map((rows: MantaNewStoRow[]) => {
      return rows.filter((one) => {
        return one.MantaNewParadigm_Size.gte(toSldDecimal("1"));
      });
    }),
    tap((stoRows: MantaNewStoRow[]) => {
      stoRows.forEach((one: MantaNewStoRow) => {
        const mergeRow: MergeRow = getRow(one.address, 'mantaNew');
        mergeRow.MantaNewParadigm_Size = one.MantaNewParadigm_Size;
        mergeRow.MantaNewParadigm_Cross = one.MantaNewParadigm_Cross;
        mergeRow.MantaNewParadigm_STO = one.MantaNewParadigm_STO;
      });
    }),
    map(() => {
      return mergeRowMap.size;
    }),
  );
}
function readGNftMainnet(file: string): Observable<any> {
  return readCsv(file).pipe(
    map((rows: GNftRow[]) => {
      return rows.map((one: GNftRow): GNftMainnetStoRow => {
        return {
          address: one.Address.toLowerCase(),
          GNFT_Mainnet_STO: toSldDecimal("400"),
        };
      });
    }),
    tap((rows: GNftMainnetStoRow[]) => {
      rows.forEach((one: GNftMainnetStoRow) => {
        const mergeRow: MergeRow = getRow(one.address, 'gnft');
        mergeRow.GNFT_Mainnet_STO = one.GNFT_Mainnet_STO;
      });
    }),
  );
}
function readGNftManta(file: string): Observable<any> {
  return readCsv(file).pipe(
    map((rows: GNftRow[]) => {
      return rows.map((one: GNftRow): GNftMantaStoRow => {
        return {
          address: one.Address.toLowerCase(),
          GNFT_Manta_STO: toSldDecimal("150"),
        };
      });
    }),
    tap((rows: GNftMantaStoRow[]) => {
      rows.forEach((one: GNftMantaStoRow) => {
        const mergeRow: MergeRow = getRow(one.address, 'gnftManta');
        mergeRow.GNFT_Manta_STO = one.GNFT_Manta_STO;
      });
    }),
  );
}
function readMerlinBefore221(file: string): Observable<any> {
  return readCsv(file).pipe(
    map((rows: Before221Row[]) => {
      return rows.map((one: Before221Row) => {
        return {
          address: one.Address.toLowerCase(),
          Merlin_Before221_STO: toSldDecimal("100"),
        };
      });
    }),
    tap((rows: Before221StoRow[]) => {
      rows.forEach((one: Before221StoRow) => {
        const mergeRow: MergeRow = getRow(one.address, before221);
        mergeRow.Merlin_Before221_STO = one.Merlin_Before221_STO;
      });
    }),
  );
}
function readAlliance(file1: string, file2: string): Observable<any> {
  return zip(readCsv(file1), readCsv(file2)).pipe(
    map(([rows1, rows2]) => {
      const level1: Alliance1StoRow[] = rows1.map(
        (one: { Address: string }) => {
          return {
            address: one.Address.toLowerCase(),
            Alliance_Level1_STO: toSldDecimal("50"),
          };
        },
      );

      const level1Total: SldDecimal = toSldDecimal("50").mul(
        BigInt(level1.length),
      );
      const level2Amount: SldDecimal = toSldDecimal("150000")
        .sub(level1Total)
        .div(BigInt(rows2.length));

      const level2: Alliance2StoRow[] = rows2.map((one) => {
        return {
          address: one.Address.toLowerCase(),
          Alliance_Level2_STO: level2Amount,
        };
      });

      return { level1, level2 };
    }),
    tap(({ level1, level2 }) => {
      level1.forEach((one: Alliance1StoRow) => {
        const mergeRow: MergeRow = getRow(one.address, 'level1');
        mergeRow.Alliance_Level1_STO = one.Alliance_Level1_STO;
      });

      level2.forEach((one: Alliance2StoRow) => {
        const mergeRow: MergeRow = getRow(one.address, 'level2');
        mergeRow.Alliance_Level2_STO = one.Alliance_Level2_STO;
      });
    }),
    map(() => {
      return mergeRowMap.size;
    }),
  );
}
function readCStoneMinter(file: string): Observable<any> {
  return readCsv(file).pipe(
    map((rows: CStoneMinterRow[]) => {
      return rows.filter((one) => one.mint_cSTONE === "T");
    }),
    map((rows: CStoneMinterRow[]) => {
      return rows.map((one: CStoneMinterRow) => {
        return {
          address: one.Address.toLowerCase(),
          CStoneMinter_STO: toSldDecimal("300"),
        };
      });
    }),
    tap((rows: CStoneMinterStoRow[]) => {
      rows.forEach((one: CStoneMinterStoRow) => {
        const mergeRow: MergeRow = getRow(one.address, 'cstoneminter');
        mergeRow.CStoneMinter_STO = one.CStoneMinter_STO;
      });
    }),
    map(() => {
      return mergeRowMap.size;
    }),
  );
}
function readBob(file: string): Observable<any> {
  return readCsv(file).pipe(
    map((rows: BobRow[]) => {
      return rows.map((one: BobRow) => {
        return {
          address: one.Address.toLowerCase(),
          Bob_Amount: toSldDecimal(one.Total_Amount),
          Bob_STO: toSldDecimal("100"),
        };
      });
    }),
    map((rows: BobStoRow[]) => {
      return rows.filter((one) => one.Bob_Amount.gte(toSldDecimal("0.98")));
    }),
    tap((rows: BobStoRow[]) => {
      rows.forEach((one: BobStoRow) => {
        const mergeRow: MergeRow = getRow(one.address, 'bob');
        mergeRow.Bob_Amount = one.Bob_Amount;
        mergeRow.Bob_STO = one.Bob_STO;
      });
    }),
  );
}

const wave1 = "./data/wave_points/wave1_points.csv";
const waveBtc = "./data/wave_points/wave_btc_points.csv";
const waveBnb = "./data/wave_points/wave_bnb_points.csv";
const bera = "./data/wave_points/bera_points.csv";
const manta = "./data/merge_points/manta_points_processed.csv";
const welfare = "./data/merge_points/welfare.csv";
const mantaNewParadigm = "./data/merge_points/manta_new_paradigm.csv";
const gnftMainnet = "./data/merge_points/gnft-mainnet-users.csv";
const gnftManta = "./data/merge_points/gnft-manta-users.csv";
const before221 = "./data/merge_points/before221.csv";
const allianceLevel1 = "./data/merge_points/alliance-level-1.csv";
const allianceLevel2 = "./data/merge_points/alliance-level-2.csv";
const cStoneMinter = "./data/merge_points/cstone-minter.csv";
const bob = "./data/merge_points/bob.csv";

readWavePoints(wave1, "Wave1", SldDecimal.fromNumeric("30000000", 18))
  .pipe(
    switchMap(() => {
      return readWavePoints(
        waveBtc,
        "STONE_BTC",
        SldDecimal.fromNumeric("10000000", 18),
      );
    }),
    switchMap(() => {
      return readWavePoints(
        waveBnb,
        "STONE_BNB",
        SldDecimal.fromNumeric("850000", 18),
      );
    }),
    switchMap(() => {
      return readWavePoints(
        bera,
        "BeraWave",
        SldDecimal.fromNumeric("8250000", 18),
      );
    }),
    switchMap(() => {
      return readMantaPoints(manta);
    }),
    switchMap(() => {
      return readWelfareSto(welfare);
    }),
    switchMap(() => {
      return readMantaNewParadigm(mantaNewParadigm);
    }),
    switchMap(() => {
      return readGNftMainnet(gnftMainnet);
    }),
    switchMap(() => {
      return readGNftManta(gnftManta);
    }),
    switchMap(() => {
      return readMerlinBefore221(before221);
    }),
    switchMap(() => {
      return readAlliance(allianceLevel1, allianceLevel2);
    }),
    switchMap(() => {
      return readCStoneMinter(cStoneMinter);
    }),
    switchMap(() => {
      return readBob(bob);
    }),
    tap(() => {
      // 处理MantaNewParadigm的STO
      // 交叉并大于等于1ETH，或者大于20ETH的用户，STO为100
      Array.from(mergeRowMap.values()).forEach((one: MergeRow) => {
        const isNPUser: boolean = one.MantaNewParadigm_Size.gte(
          toSldDecimal("1"),
        );

        const isCross: boolean =
          isNPUser &&
          (one.Welfare_STO.gtZero() ||
            one.RNP_final_STO.gtZero() ||
            one.Wave1_STO.gtZero() ||
            one.BeraWave_STO.gtZero() ||
            one.STONE_BTC_STO.gtZero() ||
            one.STONE_BNB_STO.gtZero() ||
            one.GNFT_Mainnet_STO.gtZero() ||
            one.GNFT_Manta_STO.gtZero() ||
            one.Merlin_Before221_STO.gtZero() ||
            one.Alliance_Level1_STO.gtZero() ||
            one.Alliance_Level2_STO.gtZero() ||
            one.CStoneMinter_STO.gtZero() ||
            one.Bob_STO.gtZero());

        one.MantaNewParadigm_Cross = isCross;
        one.MantaNewParadigm_STO =
          isCross || one.MantaNewParadigm_Size.gte(toSldDecimal("20"))
            ? toSldDecimal("100")
            : SldDecimal.ZERO;
      });
      //
    }),
    tap(() => {
      // 添加特殊的STO
      const additionItems = [
        {
          address: "0xd506864036873c7bcccb9b9c4cd1ea7e339b1863".toLowerCase(),
          sto: SldDecimal.fromNumeric("5000", 18),
        },
        {
          address: "0x89fbbc26f1596f45dcb4a7b2f68f6914aee9ed10".toLowerCase(),
          sto: SldDecimal.fromNumeric("1000", 18),
        },
        {
          address: "0x92e529b32b38e436aF452a36dF101602031459eF".toLowerCase(),
          sto: SldDecimal.fromNumeric("5000", 18),
        },
      ];

      additionItems.forEach((one) => {
        if (!mergeRowMap.has(one.address)) {
          mergeRowMap.set(one.address, emptyRow(one.address));
        }

        const userRow: MergeRow = getRow(one.address, 'adition');
        userRow.Special_STO = one.sto;
      });
    }),
  )
  .subscribe({
    next: () => {
      writeMergedPoints();
    },
    error: (err) => {
      console.error(err);
    },
  });
