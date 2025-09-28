"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("node-fetch");
const node_global_proxy_1 = __importDefault(require("node-global-proxy"));
const request = __importStar(require("superagent"));
node_global_proxy_1.default.setConfig({ http: 'http://127.0.0.1:7300', https: 'http://127.0.0.1:7300' });
node_global_proxy_1.default.start();
const param = {
    jsonrpc: '2.0',
    id: 1,
    method: 'chain_list',
    params: [],
};
request.post('https://api.studio.thegraph.com/deploy')
    .set('User-Agent', '@graphprotocol/graph-cli@0.69.1')
    .set('content-type', 'application/json')
    .send(param).then(res => {
    console.log(res);
    console.log(res.body);
});
