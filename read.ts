import * as _ from "lodash";
import { querySubAddresses } from "./tasks/query-address";
import { httpPost } from "./utils/http";
import { map, mergeMap, switchMap, toArray } from "rxjs/operators";
import { from, zip } from "rxjs";

const subs1: string[] = [
  "0x2eF022bA32b4037CaD104Ba71f60a699CcCe8265".toLowerCase(),
];

function getParams(users: string[]) {
  const userStr = users.map((one) => `"${one}"`).join(",");
  const param: any = {
    query: `{
            tokenHolders(first: 1000, where: {user_in: [${userStr}]}) {
                lastBalance,
                user,
                token
            }
        }`,
  };

  return param;
}

function getLpParams(users: string[]) {
  const userStr = users.map((one) => `"${one}"`).join(",");
  return {
    query: `{
                staStoneLpHolders(first:2, where: { id_in: [ ${userStr} ]}) {
                    id,
                    lpBalance,
                    capStone
                    effectStone
                }
        }`,
  };
}

function fetchUsers(users: string[]) {
  return httpPost(
    "https://api.studio.thegraph.com/query/70107/scroll-stone/v0.2.4",
    getParams(users),
  ).pipe(
    map((res) => {
      const holders: any[] = res.body.data.tokenHolders;

      const total: bigint = holders
        .map((one) => BigInt(one.lastBalance))
        .reduce((acc, cur) => {
          return acc + cur;
        }, BigInt(0));

      return total;
    }),
  );
}

function fetchLpUsers(users: string[]) {
  return httpPost(
    "https://api.studio.thegraph.com/query/70107/scroll-stone/v0.2.4",
    getLpParams(users),
  ).pipe(
    map((res) => {
      const holders: any[] = res.body.data.staStoneLpHolders;

      const total: bigint = holders
        .map((one) => BigInt(one.effectStone))
        .reduce((acc, cur) => {
          return acc + cur;
        }, BigInt(0));

      return total;
    }),
  );
}

querySubAddresses(subs1)
  .pipe(
    switchMap((all: string[]) => {
      console.log("address count", all.length);
      const userGroups = _.chunk(subs1, 100);
      return from(userGroups).pipe(
        mergeMap((group) => {
          return zip(fetchLpUsers(group), fetchUsers(group)).pipe(
            map(([a, b]) => a + b),
          );
        }),
        toArray(),
        map((amounts: bigint[]) => {
          return amounts.reduce((acc, cur) => {
            return acc + cur;
          }, BigInt(0));
        }),
      );
    }),
  )
  .subscribe({
    next: (all) => {
      console.log(all / 1000000000000000000n);
    },
  });
