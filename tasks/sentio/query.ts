import { httpPost } from "../../utils/http";
import { map } from "rxjs/operators";
import { tap } from "rxjs";

const api =
  "https://app.sentio.xyz/api/v1/analytics/garlic_william/aptos-echelon/sql/execute";
const apikey = "HQNa6RyRBQivK74pID6ZVRPai0vcXlWOQ";
const payload = {
  sqlQuery: {
    sql: "SELECT * from  `Holder`",
  },
};

//
httpPost(api, payload, { header: { "api-key": apikey } })
  .pipe(
    map((res) => {
      const data = res.body.result;
      const rows = data.rows.map((one: any) => {
        return {
          points: BigInt(one.accPoints + one.estPoints),
        };
      });
      console.log(rows);

      return rows;
    }),
    tap((rows: any[]) => {}),
  )
  .subscribe();
