import { EMPTY, Observable, tap } from "rxjs";
import { httpGet } from "../../utils/http";
import { expand, last, map } from "rxjs/operators";
import { SldDecimal } from "../../utils/decimal";
import { writeCsv } from "../common/csv";

type User = {
  address: string;
  pointsEarn: string;
  isValid: true;
  refRate: number;
  pointsRef: string;
};

const batchSize: number = 1000;
const file = "./data/wave_points/turtle_bera_points.csv";

function fetchApi(offset: number) {
  return `https://api.stakestone.io/points/bera_turtle/${offset}/${batchSize}`;
}

function fetchTurtleWave1(
  offset: number,
): Observable<{ users: any[]; next: boolean }> {
  const url: string = fetchApi(offset);

  return httpGet(url).pipe(
    map((res) => {
      const data = res.body.points;
      return {
        users: data,
        next: data.length >= batchSize,
      };
    }),
  );
}

function fetch(): Observable<User[]> {
  return fetchTurtleWave1(0).pipe(
    expand((res) => {
      if (!res.next) {
        return EMPTY;
      }

      console.log("cur get:", res.users.length);

      return fetchTurtleWave1(res.users.length).pipe(
        map((newRes) => {
          return {
            users: [...res.users, ...newRes.users],
            next: newRes.next,
          };
        }),
      );
    }),
    last(),
    map((rs) => {
      return rs.users;
    }),
  );
}

function validValue(isValid: boolean): number {
  return isValid ? 1 : 0;
}

function compare(user1: User, user2: User): number {
  if (user1.isValid !== user2.isValid) {
    return validValue(user1.isValid) - validValue(user2.isValid);
  }

  const p1 = SldDecimal.fromNumeric(user1.pointsRef, 18);
  const p2 = SldDecimal.fromNumeric(user2.pointsRef, 18);

  return p1.lt(p2) ? -1 : 1;
}

fetch()
  .pipe(
    map((users) => {
      return users.sort(compare);
    }),
    map((users) => {
      const total = users.reduce(
        (sum, cur) => {
          const p = cur.isValid
            ? SldDecimal.fromNumeric(cur.pointsEarn, 18)
            : SldDecimal.ZERO;
          const r = SldDecimal.fromNumeric(cur.pointsRef, 18);

          sum.primary = sum.primary.add(p);
          sum.ref = sum.ref.add(r);

          return sum;
        },
        { primary: SldDecimal.ZERO, ref: SldDecimal.ZERO },
      );

      users.push({
        address: "Total",
        pointsEarn: total.primary.toNumeric(),
        isValid: true,
        refRate: 10,
        pointsRef: total.ref.toNumeric(),
      });

      return users;
    }),
    tap((users) => {
      writeCsv(file, users);
    }),
  )
  .subscribe();
