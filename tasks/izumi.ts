import {SldDecimal} from "../utils/decimal";

export const MIN_TICK: number = -887272;
export const MAX_TICK: number = -MIN_TICK;
export const Q32: bigint = 2n ** 32n;
export const Q64: bigint = 2n ** 64n;
export const Q96 = 2n ** 96n;
export const Q192 = Q96 ** 2n;
export const ZERO: bigint = 0n;
export const ONE: bigint = 1n;
export const MaxUint256: bigint = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');


function mulShift(val: bigint, mulBy: string): bigint {
    return (val * BigInt(mulBy)) >> 128n
}

function tickToSqrtPrice(tick: bigint): bigint {
    const absTick: number = Number((tick < 0 ? -tick : tick));

    let ratio: bigint =
        (absTick & 0x1) != 0
            ? BigInt('0xfffcb933bd6fad37aa2d162d1a594001')
            : BigInt('0x100000000000000000000000000000000')
    if ((absTick & 0x2) != 0) ratio = mulShift(ratio, '0xfff97272373d413259a46990580e213a')
    if ((absTick & 0x4) != 0) ratio = mulShift(ratio, '0xfff2e50f5f656932ef12357cf3c7fdcc')
    if ((absTick & 0x8) != 0) ratio = mulShift(ratio, '0xffe5caca7e10e4e61c3624eaa0941cd0')
    if ((absTick & 0x10) != 0) ratio = mulShift(ratio, '0xffcb9843d60f6159c9db58835c926644')
    if ((absTick & 0x20) != 0) ratio = mulShift(ratio, '0xff973b41fa98c081472e6896dfb254c0')
    if ((absTick & 0x40) != 0) ratio = mulShift(ratio, '0xff2ea16466c96a3843ec78b326b52861')
    if ((absTick & 0x80) != 0) ratio = mulShift(ratio, '0xfe5dee046a99a2a811c461f1969c3053')
    if ((absTick & 0x100) != 0) ratio = mulShift(ratio, '0xfcbe86c7900a88aedcffc83b479aa3a4')
    if ((absTick & 0x200) != 0) ratio = mulShift(ratio, '0xf987a7253ac413176f2b074cf7815e54')
    if ((absTick & 0x400) != 0) ratio = mulShift(ratio, '0xf3392b0822b70005940c7a398e4b70f3')
    if ((absTick & 0x800) != 0) ratio = mulShift(ratio, '0xe7159475a2c29b7443b29c7fa6e889d9')
    if ((absTick & 0x1000) != 0) ratio = mulShift(ratio, '0xd097f3bdfd2022b8845ad8f792aa5825')
    if ((absTick & 0x2000) != 0) ratio = mulShift(ratio, '0xa9f746462d870fdf8a65dc1f90e061e5')
    if ((absTick & 0x4000) != 0) ratio = mulShift(ratio, '0x70d869a156d2a1b890bb3df62baf32f7')
    if ((absTick & 0x8000) != 0) ratio = mulShift(ratio, '0x31be135f97d08fd981231505542fcfa6')
    if ((absTick & 0x10000) != 0) ratio = mulShift(ratio, '0x9aa508b5b7a84e1c677de54f3e99bc9')
    if ((absTick & 0x20000) != 0) ratio = mulShift(ratio, '0x5d6af8dedb81196699c329225ee604')
    if ((absTick & 0x40000) != 0) ratio = mulShift(ratio, '0x2216e584f5fa1ea926041bedfe98')
    if ((absTick & 0x80000) != 0) ratio = mulShift(ratio, '0x48a170391f7dc42444e8fa2')


    if (tick > 0) ratio = MaxUint256 / ratio

    // back to Q64
    return ratio % Q32 > ZERO ? ratio / Q32 + ONE : ratio / Q32
}

export function token0Amount(liquidity: bigint, tickA: bigint, tickB: bigint): bigint {
    const sqrtA: bigint = tickToSqrtPrice(tickA);
    const sqrtB: bigint = tickToSqrtPrice(tickB);

    const [sqrtAPrice, sqrtBPrice]: [bigint, bigint] = sqrtA > sqrtB ? [sqrtB, sqrtA] : [sqrtA, sqrtB];

    const numerator1: bigint = liquidity << 96n;
    const numerator2: bigint = sqrtBPrice - sqrtAPrice;

    return (numerator1 * numerator2) / sqrtBPrice / sqrtAPrice;
}

export function token1Amount(liquidity: bigint, tickA: bigint, tickB: bigint): bigint {
    const sqrtA: bigint = tickToSqrtPrice(tickA);
    let sqrtB: bigint = tickToSqrtPrice(tickB);

    const [sqrtAPrice, sqrtBPrice]: [bigint, bigint] = sqrtA > sqrtB ? [sqrtB, sqrtA] : [sqrtA, sqrtB];

    return (liquidity * (sqrtBPrice - sqrtAPrice)) / Q96;
}

// ----

export function token0Amount_(liquidity: bigint, tickA: bigint, tickB: bigint): bigint {
    const sqrtB: bigint = tickToSqrtPrice(tickB);
    const sqrtPricePrPl_96 = tickToSqrtPrice(tickB - tickA);

    const rate: bigint = tickToSqrtPrice(1n);
    const sqrtPricePrM1_96 = sqrtB * Q96 / rate;

    return liquidity * (sqrtPricePrPl_96 - Q96) / (sqrtB - sqrtPricePrM1_96)
}

export function token1Amount_(liquidity: bigint, tickA: bigint, tickB: bigint): bigint {
    const sqrtA: bigint = tickToSqrtPrice(tickA);
    const sqrtB: bigint = tickToSqrtPrice(tickB);

    const rate: bigint = tickToSqrtPrice(1n);

    const numerator: bigint = (sqrtB - sqrtA);
    const denominator: bigint = rate - Q96;

    return liquidity * numerator / denominator;
}

// ----


export function token1Amount__(liquidity: bigint, sqrtA: bigint, sqrtB: bigint): bigint {
    const rate: bigint = tickToSqrtPrice(1n);
    const numerator: bigint = sqrtB - sqrtA;
    const denominator: bigint = rate - Q96;

    return liquidity * numerator / denominator;
}

export function appendAmount1(liquidity: bigint, curPrice: bigint) {
    return liquidity * curPrice / Q96;
}

export function appendAmount0(liquidity: bigint, curPrice: bigint): bigint {
    return liquidity * Q96 / curPrice
}

// pool
const tickNow: bigint = -3n;
const realCurPrice: bigint = 79217520857870941958832916148n;
const tickCurPrice: bigint = tickToSqrtPrice(tickNow);

// position
const tickLow: bigint = -887270n;
const tickUpp: bigint = 887270n;
const liq: bigint = 7998936281831382n;

console.log('cur price ==', realCurPrice, tickCurPrice);


const amount0_ = token0Amount_(liq, tickNow, tickUpp);
const amount1_ = token1Amount_(liq, tickLow, tickNow );

///
const amount1__ = token1Amount__(liq, tickToSqrtPrice(tickLow), realCurPrice);
const amountAppend1__ = appendAmount1(liq, realCurPrice);
// --

const amount0 = SldDecimal.fromOrigin(amount0_, 18);
const amount1 = SldDecimal.fromOrigin(amount1_, 18);

console.log('amount 0', amount0_);
console.log('amount 1', amount1_, amount1__, amountAppend1__, amountAppend1__ + amount1__);

console.log('amount 0', amount0.format({fix: 7}));
console.log('amount 1', amount1.format({fix: 7}));