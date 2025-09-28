import {readCsv} from "../common/csv";
import {map} from "rxjs/operators";
import {switchMap, tap} from "rxjs";
import fs from "fs";


readCsv("./data/aria/ip_rewards.csv").pipe(
    map(data => {
        return data.map(item => {
            return {
                address: item.address,
                ipAmount: item['$IP']
            }
        })
    }),
    tap((dataRows) => {
        fs.writeFileSync("./data/aria/ip_rewards.json", JSON.stringify(dataRows));
    })
).subscribe()