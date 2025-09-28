import {httpGet} from "./utils/http";
import * as request from "superagent";
const https = require('https');
import proxy from 'node-global-proxy';
const agent = new https.Agent({
    rejectUnauthorized: false // 强烈不推荐在生产环境中使用！
});

proxy.setConfig({ http: 'http://127.0.0.1:7300', https: 'http://127.0.0.1:7300' });
proxy.start();

const req = request.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest')
    .set('X-CMC_PRO_API_KEY', '772c46f9-8594-4987-8c0f-6caa2291242b')
    .set('User-Agent', 'PostmanRuntime/7.29.0')
    .set('Accept', '*/*')
    .agent(agent)
    .query({"slug": "stakestone"});

console.log(req.method);

req.end((err, res) => {
    console.log("err", err);
    console.log("res", res);
});