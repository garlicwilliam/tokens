import { SldDecimal, SldDecPercent } from "../../utils/decimal";
import { readCsv, writeCsv } from "../common/csv";
import { map } from "rxjs/operators";

type InputRow = {
  address: string;
  points: string;
};

type OutputRow = {
  address: string;
  RNP_Points: SldDecimal;
  RNP_primary_STO: SldDecimal;
  RNP_final_STO: SldDecimal;
};

const inputFile = "./data/merge_points/manta_points.csv";
const outputFile = "./data/merge_points/manta_points_processed.csv";
const totalSTO = SldDecimal.fromNumeric("10000000", 18);

function processRnp() {
  readCsv(inputFile)
    .pipe(
      map((rows: InputRow[]) => {
        return rows.map((one: InputRow): OutputRow => {
          return {
            address: one.address.toLowerCase(),
            RNP_Points: SldDecimal.fromNumeric(one.points.toString(), 18),
            RNP_primary_STO: SldDecimal.ZERO,
            RNP_final_STO: SldDecimal.ZERO,
          };
        });
      }),
      map((rows: OutputRow[]) => {
        const totalPoints: SldDecimal = rows.reduce(
          (acc, one) => acc.add(one.RNP_Points),
          SldDecimal.ZERO,
        );

        const totalPointsNum: bigint = totalPoints.toOrigin();

        rows.forEach((one: OutputRow) => {
          one.RNP_primary_STO = totalSTO
            .mul(one.RNP_Points.toOrigin())
            .div(totalPointsNum);
        });

        // 从多到少排序
        rows = rows.sort((a, b) => (a.RNP_Points.lte(b.RNP_Points) ? 1 : -1));

        // first 11%
        const firstCount: number = 11;

        //
        const needProcessFirst: OutputRow[] = rows.slice(0, firstCount);
        const needProcessLast: OutputRow[] = rows.slice(firstCount);

        // 每个用户减少20%，也就是说，最后的STO是80%
        const reduceRate: SldDecPercent = SldDecPercent.genPercent("80");
        const atLeastSTO: SldDecimal = SldDecimal.fromNumeric("100", 18);

        needProcessFirst.forEach((one: OutputRow) => {
          one.RNP_final_STO = reduceRate.applyTo(one.RNP_primary_STO);
          if (one.RNP_final_STO.lt(atLeastSTO)) {
            one.RNP_final_STO = atLeastSTO;
          }
        });
        // 不足100STO的用户不足到100STO
        needProcessLast.forEach((one: OutputRow) => {
          one.RNP_final_STO = one.RNP_primary_STO.lt(atLeastSTO)
            ? atLeastSTO
            : one.RNP_primary_STO;
        });
        //

        return [...needProcessFirst, ...needProcessLast];
      }),
      map((rows: OutputRow[]) => {
        const sum0 = {
          address: "SUM",
          RNP_Points: SldDecimal.ZERO,
          RNP_primary_STO: SldDecimal.ZERO,
          RNP_final_STO: SldDecimal.ZERO,
        };

        const sum: OutputRow = rows.reduce((acc, one) => {
          acc.RNP_Points = acc.RNP_Points.add(one.RNP_Points);
          acc.RNP_primary_STO = acc.RNP_primary_STO.add(one.RNP_primary_STO);
          acc.RNP_final_STO = acc.RNP_final_STO.add(one.RNP_final_STO);

          return acc;
        }, sum0);

        const writeRows = [...rows, sum].map((one: OutputRow) => {
          return {
            address: one.address,
            RNP_Points: one.RNP_Points.toNumeric(),
            RNP_primary_STO: one.RNP_primary_STO.toNumeric(),
            RNP_final_STO: one.RNP_final_STO.toNumeric(),
          };
        });

        return writeRows;
      }),
    )
    .subscribe({
      next: (rows) => {
        writeCsv(outputFile, rows);
      },
      error: (err) => {
        console.log("error", err);
      },
    });
}

processRnp();
