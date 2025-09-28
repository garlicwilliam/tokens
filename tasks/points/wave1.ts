import { SldDecimal, SldDecPercent } from "../../utils/decimal";
import { httpGet, httpPost } from "../../utils/http";
import { expand, map } from "rxjs/operators";
import { EMPTY, Observable, switchMap } from "rxjs";
import fs from "fs";
import * as fastcsv from "fast-csv";
import { AddressReplace } from "./conf";
import { isValidAddress } from "../../utils/address";

type KindType = "wave_bnb" | "bera" | "wave1" | "wave_btc";
const kind: KindType = "wave_btc"; // bera, wave_btc, wave1, wave_bnb
const batch = 1000;

function apiUrl(offset: number, size: number): string {
  return `https://api.stakestone.io/points/${kind}/${offset}/${size}`;
}

const fileName = `./data/wave_points/${kind}_points.csv`;

const refPointBera = {
  "0x4a9ce81c0d560d2e0f9014b7d758e93a7a0a64c1": SldDecimal.fromNumeric(
    "814875.630707023619910504",
    18,
  ),
  "0xaa1582084c4f588ef9be86f5ea1a919f86a3ee57": SldDecimal.fromNumeric(
    "2324973.881594270481387551",
    18,
  ),
};
const refPointWave1 = {
  //
  "0x4a9ce81c0d560d2e0f9014b7d758e93a7a0a64c1": SldDecimal.fromOrigin(
    BigInt("1042549210511274687702"),
    18,
  ).add(SldDecimal.fromOrigin(BigInt("4140120827944343749108602"), 18)),

  //
  "0xaa1582084c4f588ef9be86f5ea1a919f86a3ee57": SldDecimal.fromOrigin(
    BigInt("2606422907613082959420"),
    18,
  )
    .add(SldDecimal.fromOrigin(BigInt("10886083208126120092860588"), 18))
    .add(SldDecimal.fromOrigin(BigInt("1777224698182745181660"), 18)),

  //
  "0x47d7f7fa8288b9367eb5fa4e50fd1017e99608b1": SldDecimal.fromOrigin(
    BigInt("709110572492888826028404"),
    18,
  ),
};
console.log("bera", refPointBera);
console.log("wave1", refPointWave1);
const refPointWaveBnb = [{}];
const refPointWaveBtc = {
  "0xec861ed6d72eeaa20e5bc85881a2750206384f1d34b281555f41da75221b1b8b":
    SldDecimal.fromOrigin(BigInt("2942050492832619158333256"), 18),
} as const;

type SpecialPoints = { address: string; points: SldDecimal };
const PointsSpecialProcess = {
  wave1: [
    // 指定减
    {
      address: "0xd746a2a6048c5d3aff5766a8c4a0c8cfd2311745",
      points: refPointWave1["0xaa1582084c4f588ef9be86f5ea1a919f86a3ee57"].neg(),
    },
    // 指定减
    {
      address: "0xb36d9351271b5ec1438a998584ea676db0316e75",
      points: refPointWave1["0x4a9ce81c0d560d2e0f9014b7d758e93a7a0a64c1"].neg(),
    },
    // 指定加
    {
      address: "0x24e7484acb8581f4f9bdbbe3f294fa45cc7c5a89",
      points: refPointWave1["0xaa1582084c4f588ef9be86f5ea1a919f86a3ee57"].add(
        refPointWave1["0x4a9ce81c0d560d2e0f9014b7d758e93a7a0a64c1"],
      ),
    },

    // 商务减
    {
      address: "0xafffd4b2d9bbdbda44a19465192b7510883856c2",
      points: refPointWave1["0x47d7f7fa8288b9367eb5fa4e50fd1017e99608b1"].neg(),
    },
    // 指定加
    {
      address: "0x9faa4dab9a2e12cdedf1932643951399bdc0cfef",
      points: refPointWave1["0x47d7f7fa8288b9367eb5fa4e50fd1017e99608b1"],
    },
  ] as SpecialPoints[],
  bera: [
    {
      // 减
      address: "0xd746a2a6048c5d3aff5766a8c4a0c8cfd2311745",
      points: refPointBera["0xaa1582084c4f588ef9be86f5ea1a919f86a3ee57"].neg(),
    },
    {
      // 减
      address: "0xb36d9351271b5ec1438a998584ea676db0316e75",
      points: refPointBera["0x4a9ce81c0d560d2e0f9014b7d758e93a7a0a64c1"].neg(),
    },
    {
      // 加
      address: "0x24e7484acb8581f4f9bdbbe3f294fa45cc7c5a89",
      points: refPointBera["0xaa1582084c4f588ef9be86f5ea1a919f86a3ee57"].add(
        refPointBera["0x4a9ce81c0d560d2e0f9014b7d758e93a7a0a64c1"],
      ),
    },
  ] as SpecialPoints[],
  wave_bnb: [] as SpecialPoints[],
  wave_btc: [
    {
      address: "0xe6a495ff90c7d767db4e4737c1ac526e4f8c84fd".toLowerCase(),
      points: refPointWaveBtc[
        "0xec861ed6d72eeaa20e5bc85881a2750206384f1d34b281555f41da75221b1b8b"
      ]
        .mul(31n)
        .div(1000n),
    },
  ] as SpecialPoints[],
} as const;

type UserPrimary = {
  id: number;
  address: string;
  pointsEarn: string;
  pointsRef: string;
  pointsTotal: string;
};
type UserPoint = {
  id: number;
  address: string;
  pointsEarn: string;
  pointsRef: string;
  pointsTotal: SldDecimal;
  inviter?: "Y" | "CARNIVAL" | "N" | "N_N";
};

type UserInfo = {
  id: string;
  code: string;
  codeLimit: null;
  address: string;
  inviterId: string;
  tasksRetweet: number;
  tasksEditName: number;
  tasksDepositEth: number;
  twitterUsername: string;
  twitterId: string;
  twitterName: string;
  displayName: string;
  loginTime: number | null;
  twitterBindTime: number | null;
  twitterRetweetTime: number | null;
  twitterEditNameTime: null | number;
  depositEthTime: number | null;
  inviterBindTime: number;
  inviterAddress: string;
};

let CachePoints: UserPoint[] = [];

function doFetch() {
  fetchAllPoints(0)
    .pipe(
      expand((users) => {
        if (users.length === 0) {
          return EMPTY;
        }

        CachePoints.push(...users);

        return fetchAllPoints(CachePoints.length);
      }),
    )
    .subscribe({
      next: (users) => {
        if (users.length > 0) {
          console.log(
            "cur get:",
            users.length,
            "total:",
            CachePoints.length,
            "last:",
            users[users.length - 1].id,
          );
        }
      },
      error: (err) => {
        console.warn(err);
      },
      complete: () => {
        dealWithSpecialPoints(); // 积分移动和加减特殊情况

        dealWithReplace(); // 地址替换

        dealWithRemoveUser(); // 删除aptos 地址

        CachePoints.sort((a, b) => {
          return a.pointsTotal.sub(b.pointsTotal).gtZero() ? 1 : -1;
        });

        writeToFile(CachePoints, fileName);
      },
    });
}

function dealWithSpecialPoints() {
  const needProcess: SpecialPoints[] = PointsSpecialProcess[kind];
  //
  if (needProcess.length === 0) {
    return;
  }

  needProcess.forEach((item: SpecialPoints) => {
    let user: UserPoint | undefined = CachePoints.find(
      (one) => one.address === item.address,
    );

    if (!user) {
      const newUser: UserPoint = {
        id: 99999999,
        address: item.address,
        pointsEarn: "0",
        pointsRef: "0",
        pointsTotal: SldDecimal.ZERO,
      };

      CachePoints.push(newUser);

      user = newUser;
    }

    if (user) {
      user.pointsRef = SldDecimal.fromNumeric(user.pointsRef, 18)
        .add(item.points)
        .toNumeric(true);
      user.pointsTotal = user.pointsTotal.add(item.points);
    }
  });
}

function dealWithReplace() {
  AddressReplace.forEach((rep) => {
    const removeIdx = CachePoints.findIndex((one) => {
      return one.address === rep.from;
    });
    const targetIdx = CachePoints.findIndex((one) => {
      return one.address === rep.to;
    });

    console.log(
      "find remove",
      removeIdx,
      rep.from,
      "--",
      "find insert",
      targetIdx,
      rep.to,
    );

    if (removeIdx >= 0 && targetIdx >= 0) {
      const newUser = mergePoints(
        [CachePoints[removeIdx], CachePoints[targetIdx]],
        rep.to,
      );

      if (newUser) {
        CachePoints[targetIdx] = newUser;
        CachePoints.splice(removeIdx, 1);
      }
    } else if (removeIdx >= 0) {
      CachePoints[removeIdx].address = rep.to;

      const newUser = mergePoints([CachePoints[removeIdx]], rep.to);
      if (newUser) {
        CachePoints[removeIdx] = newUser;
      }
    }
  });
}

function dealWithRemoveUser() {
  CachePoints = CachePoints.filter((one) => isValidAddress(one.address));
}

function mergePoints(userPoints: UserPoint[], to: string): UserPoint | null {
  if (userPoints.length === 1) {
    return Object.assign({}, userPoints[0], { address: to });
  } else if (userPoints.length > 1) {
    let idUser = userPoints.find((one) => one.address === to);
    if (!idUser) {
      idUser = userPoints[0];
    }

    const id = idUser.id;

    const rs = userPoints.reduce(
      (result, cur) => {
        result.pointsEarn = result.pointsEarn.add(
          SldDecimal.fromNumeric(cur.pointsEarn, 18),
        );

        result.pointsRef = result.pointsRef.add(
          SldDecimal.fromNumeric(cur.pointsRef, 18),
        );
        result.pointsTotal = result.pointsTotal.add(cur.pointsTotal);

        return result;
      },
      {
        id,
        address: to,
        pointsEarn: SldDecimal.ZERO,
        pointsRef: SldDecimal.ZERO,
        pointsTotal: SldDecimal.ZERO,
      },
    );

    return {
      id: rs.id,
      address: rs.address,
      pointsEarn: rs.pointsEarn.toNumeric(),
      pointsRef: rs.pointsRef.toNumeric(),
      pointsTotal: rs.pointsTotal,
    };
  }

  return null;
}

function fetchInvalidUsers(): Observable<string[]> {
  return httpGet("https://api.stakestone.io/points/invalid_users").pipe(
    map((res) => {
      return res.body.addresses as string[];
    }),
    map((addresses: string[]) => {
      return addresses.map((one) => one.toLowerCase());
    }),
  );
}

function fetchUsersInfo(
  addresses: string[],
): Observable<Map<string, UserInfo>> {
  const url: string = `https://points.stakestone.io/data/users`;
  return httpPost(
    url,
    { addresses },
    { header: { "admin-token": "A!@#1234" } },
  ).pipe(
    map((res) => {
      const users: UserInfo[] = res.body.users;
      const rs = new Map<string, UserInfo>();
      users.forEach((one) => {
        rs.set(one.address.toLowerCase(), one);
      });

      return rs;
    }),
  );
}

function fetchAllPoints(offset: number): Observable<UserPoint[]> {
  const url = apiUrl(offset, batch);
  const points$: Observable<UserPoint[]> = httpGet(url).pipe(
    map((res) => {
      const users: UserPrimary[] = res.body.points;

      return users;
    }),
    map((users: UserPrimary[]) => {
      return users.map((one) => ({
        id: one.id,
        address: one.address,
        pointsEarn: one.pointsEarn,
        pointsRef: one.pointsRef,
        pointsTotal: SldDecimal.fromNumeric(one.pointsTotal, 18),
      }));
    }),
  );

  return points$;
}

function writeToFile(users: UserPoint[], file: string) {
  users = users.filter((one) => !one.pointsTotal.isZero());

  const invalidUsers$: Observable<string[]> = fetchInvalidUsers();

  invalidUsers$
    .pipe(
      map((invalidUsers: string[]) => {
        return users.filter((one: UserPoint) => {
          return invalidUsers.indexOf(one.address.toLowerCase()) < 0;
        });
      }),
      map((users: UserPoint[]) => {
        const total: SldDecimal = users.reduce((acc, cur) => {
          return acc.add(cur.pointsTotal);
        }, SldDecimal.ZERO);

        const rows = users.map((one: UserPoint) => {
          return {
            address: one.address,
            pointsEarn: one.pointsEarn,
            pointsRef: one.pointsRef,
            pointsTotal: one.pointsTotal.toNumeric(),
            percent:
              SldDecPercent.fromArgs(total, one.pointsTotal).percentFormat({
                fix: 18,
              }) + "%",
            inviter: one.inviter || "",
          };
        });

        rows.push({
          address: "",
          pointsEarn: "",
          pointsRef: "",
          pointsTotal: total.toNumeric(),
          percent: "100%",
          inviter: "",
        });

        return rows;
      }),
    )
    .subscribe({
      next: (users: any[]) => {
        //
        const ws = fs.createWriteStream(file);
        //
        fastcsv
          .write(users, { headers: true })
          .pipe(ws)
          .on("finish", () => {
            console.log("Write to CSV successfully!", file);
          })
          .on("error", (err) => {
            console.error(err);
          });
      },
      error: () => {},
    });
}

doFetch();
