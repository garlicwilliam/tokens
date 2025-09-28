import {httpPost} from "../utils/http";
import {map} from "rxjs/operators";
import {SldDecimal} from "../utils/decimal";


const graph = 'https://api.studio.thegraph.com/query/70107/scroll-wave1-points-nuri/version/latest';
const holder = '0x08199dbd981bcd819a58776131a7fd6e567e6046';
const query = {
    query: `{
      positionHolder(id: "${holder}") {
        accPoints
      }
      positionHolderDailies(
        where: {
          holder:"${holder}",
        },
        orderBy: holder,
        orderDirection: desc
      )  {
        holder
        dayIndex
        points
      }
    }`
}

httpPost(graph, query).pipe(
    map((res) => {

        const dailies = res.body.data.positionHolderDailies;
        const total = res.body.data.positionHolder.accPoints;

        return {
            total, dailies
        }
    }),
    map(({total, dailies}) => {
        const dailyPoints: SldDecimal[] = dailies.map((one: any) => SldDecimal.fromOrigin(BigInt(one.points), 18));
        const totalPoints: SldDecimal = SldDecimal.fromOrigin(BigInt(total), 18);

        const dailyTotal: SldDecimal = dailyPoints.reduce((acc, cur) => acc.add(cur), SldDecimal.ZERO);

        console.log('dailyTotal', dailyTotal.format({fix: 5}));
        console.log('totalPoints', totalPoints.format({fix: 5}));
    })
).subscribe()