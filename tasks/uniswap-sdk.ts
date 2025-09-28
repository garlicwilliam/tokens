import JSBI from "jsbi";
import {TickMath} from "./uniswap-sdk-tick";

const NEGATIVE_ONE = JSBI.BigInt(-1)
const ZERO = JSBI.BigInt(0)
const ONE = JSBI.BigInt(1)
const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96))
const Q192 = JSBI.exponentiate(Q96, JSBI.BigInt(2))
const MaxUint256 = JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
const MaxUint160 = JSBI.subtract(JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(160)), ONE)

function multiplyIn256(x: JSBI, y: JSBI): JSBI {
    const product = JSBI.multiply(x, y)
    return JSBI.bitwiseAnd(product, MaxUint256)
}

function addIn256(x: JSBI, y: JSBI): JSBI {
    const sum = JSBI.add(x, y)
    return JSBI.bitwiseAnd(sum, MaxUint256)
}


export class FullMath {
    /**
     * Cannot be constructed.
     */
    private constructor() {
    }

    public static mulDivRoundingUp(a: JSBI, b: JSBI, denominator: JSBI): JSBI {
        const product = JSBI.multiply(a, b)
        let result = JSBI.divide(product, denominator)
        if (JSBI.notEqual(JSBI.remainder(product, denominator), ZERO)) result = JSBI.add(result, ONE)
        return result
    }
}

export class SqrtPriceMath {
    /**
     * Cannot be constructed.
     */
    private constructor() {
    }

    public static getAmount0Delta(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, liquidity: JSBI, roundUp: boolean): JSBI {
        if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            ;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
        }

        const numerator1 = JSBI.leftShift(liquidity, JSBI.BigInt(96))
        const numerator2 = JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)
        console.log('num1', numerator1.toString());
        console.log('num2', numerator2.toString());
        console.log('num2 = ', sqrtRatioBX96.toString(), '-', sqrtRatioAX96.toString());
        return roundUp
            ? FullMath.mulDivRoundingUp(FullMath.mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96), ONE, sqrtRatioAX96)
            : JSBI.divide(JSBI.divide(JSBI.multiply(numerator1, numerator2), sqrtRatioBX96), sqrtRatioAX96)
    }

    public static getAmount1Delta(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, liquidity: JSBI, roundUp: boolean): JSBI {
        if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            ;[sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96]
        }

        return roundUp
            ? FullMath.mulDivRoundingUp(liquidity, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96), Q96)
            : JSBI.divide(JSBI.multiply(liquidity, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)), Q96)
    }

    public static getNextSqrtPriceFromInput(sqrtPX96: JSBI, liquidity: JSBI, amountIn: JSBI, zeroForOne: boolean): JSBI {

        return zeroForOne
            ? this.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountIn, true)
            : this.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountIn, true)
    }

    public static getNextSqrtPriceFromOutput(
        sqrtPX96: JSBI,
        liquidity: JSBI,
        amountOut: JSBI,
        zeroForOne: boolean
    ): JSBI {

        return zeroForOne
            ? this.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountOut, false)
            : this.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountOut, false)
    }

    private static getNextSqrtPriceFromAmount0RoundingUp(
        sqrtPX96: JSBI,
        liquidity: JSBI,
        amount: JSBI,
        add: boolean
    ): JSBI {
        if (JSBI.equal(amount, ZERO)) return sqrtPX96
        const numerator1 = JSBI.leftShift(liquidity, JSBI.BigInt(96))

        if (add) {
            let product = multiplyIn256(amount, sqrtPX96)
            if (JSBI.equal(JSBI.divide(product, amount), sqrtPX96)) {
                const denominator = addIn256(numerator1, product)
                if (JSBI.greaterThanOrEqual(denominator, numerator1)) {
                    return FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denominator)
                }
            }

            return FullMath.mulDivRoundingUp(numerator1, ONE, JSBI.add(JSBI.divide(numerator1, sqrtPX96), amount))
        } else {
            let product = multiplyIn256(amount, sqrtPX96)

            const denominator = JSBI.subtract(numerator1, product)
            return FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denominator)
        }
    }

    private static getNextSqrtPriceFromAmount1RoundingDown(
        sqrtPX96: JSBI,
        liquidity: JSBI,
        amount: JSBI,
        add: boolean
    ): JSBI {
        if (add) {
            const quotient = JSBI.lessThanOrEqual(amount, MaxUint160)
                ? JSBI.divide(JSBI.leftShift(amount, JSBI.BigInt(96)), liquidity)
                : JSBI.divide(JSBI.multiply(amount, Q96), liquidity)

            return JSBI.add(sqrtPX96, quotient)
        } else {
            const quotient = FullMath.mulDivRoundingUp(amount, Q96, liquidity)

            return JSBI.subtract(sqrtPX96, quotient)
        }
    }
}


const sqrtPriceLower = TickMath.getSqrtRatioAtTick(-887270)
const sqrtPriceUpper = TickMath.getSqrtRatioAtTick(887270);
const sqrtPriceN3 = TickMath.getSqrtRatioAtTick(-3);
const sqrtPriceCur = JSBI.BigInt('79217407867294247266331898177');
const liquidity = JSBI.BigInt('7998936281831382');

// const amount0 = SqrtPriceMath.getAmount0Delta(sqrtPriceCur, sqrtPriceUpper, liquidity, false);
// const amount1 = SqrtPriceMath.getAmount1Delta(sqrtPriceLower, sqrtPriceCur, liquidity, false);

const amount0_1 = SqrtPriceMath.getAmount0Delta(sqrtPriceN3, sqrtPriceUpper, liquidity, false);
const amount1_1 = SqrtPriceMath.getAmount1Delta(sqrtPriceLower, sqrtPriceN3, liquidity, false);

console.log('lower', sqrtPriceLower.toString());
console.log('upper', sqrtPriceUpper.toString());
// console.log('amount 0', amount0.toString());
// console.log('amount 1', amount1.toString());
console.log('amount 0_1', amount0_1.toString());
console.log('amount 1_1', amount1_1.toString());