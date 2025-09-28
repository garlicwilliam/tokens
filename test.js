"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("superagent");
var https = require('https');
var agent = new https.Agent({
    rejectUnauthorized: false // 强烈不推荐在生产环境中使用！
});
var req = request.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?slug=stakestone')
    .set('X-CMC_PRO_API_KEY', '772c46f9-8594-4987-8c0f-6caa2291242b')
    .set('User-Agent', 'PostmanRuntime/7.29.0')
    .set('Accept', '*/*')
    .agent(agent)
    .query({ slug: "stakestone" });
console.log(req.method);
req.end(function (err, res) {
    console.log("err", err);
    console.log("res", res);
});
