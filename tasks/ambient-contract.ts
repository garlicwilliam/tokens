import {Contract, JsonRpcProvider} from 'ethers'
import {QueryAbi} from './ambient.query.abi'
import {SldDecimal} from "../utils/decimal";
import {getTokens} from "./ambient";

const owner = '0x0552ee72275a2bcf30b0e17433b478e69f32bdf7';
const base = '0x0000000000000000000000000000000000000000';
const quote = '0x80137510979822322193fc997d400d5a6c747bf7';
const poolIdx = 420;
const tickLower = 0;
const tickUpper = 404;
const blockNum = 5698824;


function getProvider() {
    return new JsonRpcProvider('https://lb.drpc.org/ogrpc?network=scroll&dkey=AsQlBGo230qhhptQOBJcQ_D52qRS1gQR7qKWGtyyLTIM')
}

async function readContract() {
    const query: Contract = new Contract('0x62223e90605845Cf5CC6DAE6E0de4CDA130d6DDf', QueryAbi, getProvider());

    const rs = await query.queryRangePosition(owner, base, quote, poolIdx, tickLower, tickUpper, {blockTag: blockNum});
    const liq = rs[0];

    const sqrt = await query.queryPrice(base, quote, poolIdx, {blockTag: blockNum});

    const {token0: t0, token1: t1} = getTokens(liq, BigInt(tickLower), BigInt(tickUpper), BigInt(sqrt));
    const tt0 = SldDecimal.fromOrigin(t0, 18);
    const tt1 = SldDecimal.fromOrigin(t1, 18);

    const rs2 = await query.queryRangeTokens(owner, base, quote, poolIdx, tickLower, tickUpper, {blockTag: blockNum})
    const a = rs2[1];
    const b = rs2[2];
    const token0 = SldDecimal.fromOrigin(a, 18);
    const token1 = SldDecimal.fromOrigin(b, 18);

    console.log('token0', token0.format({fix: 5}));
    console.log('token1', token1.format({fix: 5}));
    console.log('t0', tt0.format({fix: 5}));
    console.log('t1', tt1.format({fix: 5}));
}

readContract();