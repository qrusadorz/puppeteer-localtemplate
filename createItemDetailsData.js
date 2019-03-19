const fs = require('fs');
const { config } = require('./configs/config');
const { uploadFile } = require('./firebase/util');

const { itemDetailsFilename } = config;

const writeJsonToFile = json => {
    fs.writeFileSync(itemDetailsFilename, JSON.stringify(json));
}

const readJsonFromFile = (jsonFilename) => {
    const json = fs.readFileSync(jsonFilename);
    return JSON.parse(json);
}

const getDataFiles = () => {
    const files = fs.readdirSync('data/')
        // latest 30
        .sort((a, b) => a > b ? 1: -1)
        // limit 30 values
        .slice(-30);
    console.log("files:", files);
    return files;
}

const createChartData = (files) => {
    const result = { items: {}, ownership: config.url, timestamp: Date.now() };
    for (const file of files) {
        const json = readJsonFromFile(`data/${file}`);
        for (const item of json.items) {
            const { id, name, bestprice, timestamp } = item;
            const newItem = result.items[id] || { priceChart: [] };
            newItem.priceChart.push({
                bestprice,
                timestamp
            });
            result.items[id] = newItem;
        }
    }
    return result;
}

(async () => {
    // データフォルダから30ファイル集めてくる
    const files = getDataFiles();
    // ファイルを読んでマップに値をAdd(id, { bestprice, timestamp })していく
    const result = createChartData(files);
    // write to local file
    writeJsonToFile(result);
    // console.log("result:", readChartFromFile());
    // upload to firebase storage
    await uploadFile(itemDetailsFilename);
})();
