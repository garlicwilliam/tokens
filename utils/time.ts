export function nowTime(): number {
    return Math.floor(Date.now() / 1000);
}


export function formatTime(date: Date): string {
    const year = date.getFullYear().toString();
    const mon = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${mon}-${day} ${hour}:${minute}:${second}`;
}

export function datetime(
    year: number,
    month: number,
    date: number,
    hour: number,
    minute: number,
    second: number
): number {
    return Math.ceil(Date.UTC(year, month - 1, date, hour, minute, second) / 1000);
}


export function genDayIndex(datetime: string): bigint {
    const seconds = new Date(datetime).getTime() / 1000;
    const index = BigInt(seconds) / BigInt(86400);

    return index;
}