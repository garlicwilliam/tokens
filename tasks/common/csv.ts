import fs from "fs";
import * as fastcsv from "fast-csv";
import csv from "csv-parser";
import { AsyncSubject, Observable } from "rxjs";

export function writeCsv(file: string, data: any[]): void {
  const ws = fs.createWriteStream(file);

  fastcsv
    .write(data, { headers: true })
    .pipe(ws)
    .on("finish", () => {
      console.log("Write to CSV successfully!", file);
    })
    .on("error", (err) => {
      console.error(err);
    });
}

export function readCsv(file: string): Observable<any[]> {
  const results: any[] = [];

  const rs = new AsyncSubject<any[]>();

  fs.createReadStream(file)
    .pipe(csv())
    .on("data", (data: any) => {
      results.push(data);
    })
    .on("end", () => {
      console.log("Read CSV successfully!", file);
      rs.next(results);
      rs.complete();
    });

  return rs;
}

export function writeTxt(file: string, data: string[]): Observable<boolean> {
  const rs = new AsyncSubject<boolean>();

  fs.writeFile(file, data.join("\n"), (err) => {
    if (err) {
      console.error("写入文件时出错:", err);
      rs.next(false);
      return;
    }

    rs.next(true);
    rs.complete();

    console.log("数据已成功写到文件。");
  });

  return rs;
}
