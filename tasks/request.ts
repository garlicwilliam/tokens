import {httpGet} from "../utils/http";
import {from, mergeMap, of} from "rxjs";
import {catchError, map, toArray} from "rxjs/operators";


const url = 'https://points.stakestone.io/pubs/users/active/0/10';


from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10,11,12,13,14,15,16]).pipe(
    mergeMap(() => {
        return httpGet(url).pipe(
            map((res) => {
                if (res.status !== 200) {
                    console.log(res.status);
                }
                console.log(res.status);

                return res.body
            }),
            catchError((err) => {
                console.log(err.message)
                return of()
            }))
    }),
    catchError(err => {
        console.log(err.message);
        return of();
    }),
    toArray()
).subscribe()

