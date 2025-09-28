import {SldDecimal} from "./utils/decimal";

const duration = 1718540507n - 1717455215n;
const share = 96556508915823014n;
const amount = 100108565153318928n
const amount0 =  99999999999999999n

const pointsInt = amount * duration / 3600n;

const points = SldDecimal.fromE18(pointsInt, 18);

console.log('points', points.format({fix: 5}));


const eiShare = 106589599200757267561726n;


const eiPointsInt = eiShare / 3600n;

const eiPoints = SldDecimal.fromE18(eiPointsInt, 18);

console.log('eiPoints', eiPoints.format({fix: 5}));