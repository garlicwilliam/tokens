import {
  OkPacket,
  ProcedureCallPacket,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/typings/mysql/lib/protocol/packets';

export function isInsertSuccess(
  result:
    | OkPacket
    | ResultSetHeader
    | ResultSetHeader[]
    | RowDataPacket[]
    | RowDataPacket[][]
    | OkPacket[]
    | ProcedureCallPacket
): boolean {
  return Array.isArray(result)
    ? (result as ResultSetHeader[])[0].affectedRows > 0
    : (result as ResultSetHeader).affectedRows > 0;
}

export function isUpdateSuccess(
  result:
    | OkPacket
    | ResultSetHeader
    | ResultSetHeader[]
    | RowDataPacket[]
    | RowDataPacket[][]
    | OkPacket[]
    | ProcedureCallPacket
): boolean {
  return Array.isArray(result)
    ? (result as ResultSetHeader[])[0].affectedRows > 0
    : (result as ResultSetHeader).affectedRows > 0;
}

export function getSelectResult<T>(
  result:
    | OkPacket
    | ResultSetHeader
    | ResultSetHeader[]
    | RowDataPacket[]
    | RowDataPacket[][]
    | OkPacket[]
    | ProcedureCallPacket,
  converter: (row: RowDataPacket) => T
): T[] {
  return (result as RowDataPacket[]).map(row => {
    return converter(row);
  });
}

export function hasResultRows(
  result:
    | OkPacket
    | ResultSetHeader
    | ResultSetHeader[]
    | RowDataPacket[]
    | RowDataPacket[][]
    | OkPacket[]
    | ProcedureCallPacket
): boolean {
  return (result as RowDataPacket[]).length > 0;
}
