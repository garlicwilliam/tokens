import { EMPTY, Observable } from "rxjs";
import { httpGet } from "../../utils/http";
import { expand, last, map, switchMap } from "rxjs/operators";
import { SldDecimal } from "../../utils/decimal";
import { writeCsv } from "../common/csv";

const file = "./data/wave_points/binance_bera_points.csv";

type User = {
  address: string;
  pointsEarn: string;
  inviterAddress: string;
  pointsRef: string;
};

function fetch(): Observable<User[]> {
  return fetchUser(0).pipe(
    expand((res) => {
      if (!res.next) {
        return EMPTY;
      }

      console.log("get users", res.users.length);

      return fetchUser(res.users.length).pipe(
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
      console.log("get users", rs.users.length);
      return rs.users;
    }),
  );
}

function fetchUser(
  offset: number,
): Observable<{ users: User[]; next: boolean }> {
  const url: string = `https://api.stakestone.io/points/bera_binance/${offset}/1000`;

  return httpGet(url).pipe(
    map((res) => {
      const users: User[] = res.body.points;

      return {
        users,
        next: users.length >= 1000,
      };
    }),
  );
}

fetch()
  .pipe(
    map((users: User[]) => {
      users.sort((a, b) => {
        const pointA = SldDecimal.fromNumeric(a.pointsRef, 18);
        const pointB = SldDecimal.fromNumeric(b.pointsRef, 18);

        return pointA.lt(pointB) ? -1 : 1;
      });

      return users;
    }),
    map((users: User[]) => {
      const total: SldDecimal = users.reduce((sum, cur) => {
        const ref = SldDecimal.fromNumeric(cur.pointsRef, 18);
        return sum.add(ref);
      }, SldDecimal.ZERO);

      users.push({
        address: "Total",
        pointsEarn: "",
        inviterAddress: "",
        pointsRef: total.toNumeric(),
      });

      return users;
    }),
  )
  .subscribe({
    next: (users: User[]) => {
      console.log("write users", users.length);
      writeCsv(file, users);
    },
    error: (error) => {
      console.log("error", error);
    },
  });
