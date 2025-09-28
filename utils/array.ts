export function intArray(start: number, last: number, step: number = 1): number[] {
    const result: number[] = [];
    for (let i = start; i <= last; i += step) {
        result.push(i);
    }

    return result;
}