import {httpPost} from "./http";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";


export function theGraphQuery(url: string, param: any): Observable<any> {
    return httpPost(url, param, {header: {Authorization: 'Bearer 74ce62998c8e702cc55d36fa160b96f5'}}).pipe(map((res) => {
        if (res.status !== 200) {
            console.log("error happened");
            throw new Error(res);
        }

        return res.body;
    }));
}
