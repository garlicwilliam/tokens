import {concatMap, EMPTY, from, isObservable, Observable, of, switchMap, timeout} from 'rxjs';
import * as request from 'superagent';
import {Response} from 'superagent';
import {catchError, filter, map, take} from 'rxjs/operators';

export type HttpError = { err: any; ok: boolean };

export function httpPost(
    url: string,
    param: any,
    ops?: { isForm?: boolean; withCredentials?: boolean; throwErr?: boolean, header?: {[h: string]: string} }
): Observable<any> {
    try {
        const postUrl = ops?.isForm
            ? request.post(url).type('form').set(ops?.header|| {})
            : request.post(url).set(ops?.header|| {}).withCredentials(ops?.withCredentials || false);

        return from(postUrl.send(param)).pipe(
            catchError(err => {
                console.warn('http post error is', err);
                if (ops?.throwErr) {
                    throw err;
                } else {
                    return of({err, ok: false} as HttpError);
                }
            })
        );
    } catch (err) {
        console.warn('http post error', err);
        return of({err, ok: false, body: {code: 500}} as HttpError);
    }
}

export const normalChecker = (res: Response) => res.status === 200;
export const normalTimeout = 20000;

export function httpPostDetect(
    url: string,
    param: any,
    ops: { isForm?: boolean; withCredentials?: boolean; checker: (res: Response) => boolean; timeout?: number }
): Observable<boolean> {
    return httpPost(url, param, {...ops, throwErr: true}).pipe(
        timeout(ops.timeout || 30000),
        catchError(err => {
            return of(false);
        }),
        map(res => {
            return ops.checker(res);
        })
    );
}

export function httpPostUseRetry(
    urls: string[] | Observable<string[]>,
    param: any,
    ops?: { isForm?: boolean; withCredentials?: boolean; checker: (res: Response) => boolean; timeout?: number }
): Observable<any> {
    const urls$ = isObservable(urls) ? urls : of(urls);

    return urls$.pipe(
        switchMap(urls => {
            return from(urls);
        }),
        concatMap(url => {
            return httpPost(url, param, {...ops, throwErr: true}).pipe(
                timeout(ops?.timeout || 30000),
                catchError(err => {
                    return of(null);
                }),
                map(res => {
                    if (ops?.checker) {
                        if (ops.checker(res)) {
                            return res;
                        } else {
                            return null;
                        }
                    } else {
                        return res;
                    }
                })
            );
        }),
        filter(res => res !== null),
        take(1)
    );
}

export function httpGet(
    url: string,
    param: any = {},
    ops?: { returnError?: boolean; withCredentials?: boolean, header?: { [k: string]: string } }
): Observable<any> {
    try {
        const req: request.Request = request.get(url).withCredentials(ops?.withCredentials || false);

        if (ops?.header) {
            for (const key in ops.header) {
                req.set(key, ops.header[key]);
            }
        }

        return from(req.query(param)).pipe(
            catchError(err => {
                console.warn('http get error is', err.message);
                if (ops?.returnError) {
                    throw err;
                } else {
                    return EMPTY;
                }
            })
        );
    } catch (err) {
        console.warn(err);
        if (ops?.returnError) {
            throw err;
        } else {
            return EMPTY;
        }
    }
}

export function httpJson(url: string): Observable<any> {
    return from(request.get(url).accept('application/json')).pipe(
        map((res: Response) => {
            return res.body;
        }),
        catchError(err => {
            console.warn(err);
            return of({});
        })
    );
}
