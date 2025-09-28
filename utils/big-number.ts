export function baseBigInt(wei: number): bigint {
    const pow = BigInt(Math.abs(wei));

    return 10n ** pow;
}

export const E18: bigint = baseBigInt(18);
