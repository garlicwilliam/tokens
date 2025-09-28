import {nowTime} from "../utils/time";

const now = nowTime();

const duration = BigInt(now - 1725096407);
const amount = 10000000000000000n

const points = duration * amount * 2n / 86400n;

console.log(2086949999999999998n + points);

const append = 9999997000000000n * BigInt(now - 1725123227) / 86400n;

console.log(append + 2094052777715277774n);