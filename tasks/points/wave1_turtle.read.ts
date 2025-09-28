import { readCsv, writeTxt } from "../common/csv";
import { switchMap } from "rxjs/operators";

const readFile = "tasks/points/stakestone_36.txt";
const writeFile = "data/wave_points/turtle_wave1.csv";

readCsv(readFile)
  .pipe(
    switchMap((rows) => {
      const addresses: string[] = rows.map((row) => {
        return `('${row.user.toLowerCase()}'),`;
      });

      return writeTxt(writeFile, addresses);
    }),
  )
  .subscribe();
