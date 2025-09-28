import {JsonRpcProvider} from "ethers";
import {firstValueFrom, from, mergeMap, Observable, switchMap} from "rxjs";
import {map, toArray} from "rxjs/operators";
import {readCsv} from "./common/csv";

// 以太坊 RPC URL
const provider = new JsonRpcProvider(
    "https://lb.drpc.org/ogrpc?network=bsc&dkey=AsQlBGo230qhhptQOBJcQ_B0i7uWnPAR76ThFhW5UfFk",
    // "https://lb.drpc.org/ogrpc?network=ethereum&dkey=AsQlBGo230qhhptQOBJcQ_B0i7uWnPAR76ThFhW5UfFk",
    // "https://lb.drpc.org/ogrpc?network=linea&dkey=AsQlBGo230qhhptQOBJcQ_B0i7uWnPAR76ThFhW5UfFk",
    // "https://lb.drpc.org/ogrpc?network=manta-pacific&dkey=AsQlBGo230qhhptQOBJcQ_B0i7uWnPAR76ThFhW5UfFk",
    // "https://lb.drpc.org/ogrpc?network=mode&dkey=AsQlBGo230qhhptQOBJcQ_B0i7uWnPAR76ThFhW5UfFk",
    // "https://lb.drpc.org/ogrpc?network=scroll&dkey=AsQlBGo230qhhptQOBJcQ_B0i7uWnPAR76ThFhW5UfFk",
    // "https://merlin.blockpi.network/v1/rpc/d741a552e43213088f8b749d7f7fffbae870f73d",
    // "https://lb.drpc.org/ogrpc?network=zircuit-mainnet&dkey=AsQlBGo230qhhptQOBJcQ_B0i7uWnPAR76ThFhW5UfFk",
    // "https://lb.drpc.org/ogrpc?network=soneium&dkey=AsQlBGo230qhhptQOBJcQ_B0i7uWnPAR76ThFhW5UfFk",
    // "https://rpc.bsquared.network",
);
const ethSafe: string[] = [];

function readAddresses(): Observable<string[]> {
    return readCsv("./data/aria/users.csv").pipe(
        map((rows) => {
            return rows.map((row) => row.address);
        }),
    );
}

async function checkSafeWallet(address: string) {
    try {
        const code = await provider.getCode(address);
        // 这里需要更详细的合约代码分析来精确识别 Safe 钱包
        // 最准确的方式是通过比较合约部署时的init code和合约代码
        if (code !== "0x") {
            if (code.length > 48) {
                ethSafe.push(address);
                console.log(`${address} 是一个合约地址.`);
                // console.log("code", code);
            }

        } else {
            //console.log(`${address} 不是一个合约地址.`);
        }
    } catch (error) {
        console.error(`检查 ${address} 时出错：`, error);
    }
}


async function main() {
    readAddresses()
        .pipe(
            switchMap((addresses: string[]) => {
                return from(addresses);
            }),
            mergeMap((address) => {
                return from(checkSafeWallet(address));
            }, 40),
            toArray(),
        )
        .subscribe({
            next: () => {
                console.log("eth safe", ethSafe);
            },
        });
}

main();
