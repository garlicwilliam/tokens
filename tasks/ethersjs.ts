import {keccak256, toUtf8Bytes} from "ethers";

// 事件签名
const eventSignature = "CreateMarket(bytes32,(address,address,address,address,uint256))";

// 计算 Keccak256 哈希
const topic0 = keccak256(toUtf8Bytes(eventSignature));

console.log(topic0);