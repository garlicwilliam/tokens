import * as fs from 'fs';
import * as readline from 'readline';

const inputFileName = './tasks/logs/filtered_access_6.log';
const outputFileName = './tasks/logs/filtered_access_7.log';

async function filterLogs() {
    const fileStream = fs.createReadStream(inputFileName);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const outputFile = fs.createWriteStream(outputFileName);

    for await (const line of rl) {
        if (!line.includes('/static/media')) {
            outputFile.write(line + '\n');
        }
    }

    console.log(`已将过滤后的日志保存到 ${outputFileName}`);
}

filterLogs();