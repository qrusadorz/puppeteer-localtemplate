// const functions = require('firebase-functions');
const puppeteer = require('puppeteer');
const { getItems, getSelectItems, getBrands } = require('./sites/util');
const { updateItems, uploadItems } = require('./firebase/util');
const { config } = require('./configs/config');

const fs = require("fs");

const isRecovery = false;
const isDev = false;
const enableBrowserConsole = false;
const crawlDuration = 6000;

const latestFilename = `latest.json`;

const writeJsonToFile = json => {
    fs.writeFileSync(`data${Date.now()}.json`, JSON.stringify(json));
    // for upload
    fs.writeFileSync(latestFilename, JSON.stringify(json));
}

const readItems = () => {
    const json = JSON.parse(fs.readFileSync(latestFilename));
    return json;
};

const failedFilename = `failed.json`;

const writeJsonToFailedFile = json => {
    fs.writeFileSync(failedFilename, JSON.stringify(json));
}

const deleteFailedFile = () =>{
    fs.unlinkSync(failedFilename);
}

const readFailedItems = () => {
    const json = JSON.parse(fs.readFileSync(failedFilename));
    return json;
};

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const crawl = async (browser, param) => {
    console.log("puppeteer start:", param.url);

    const { url, name, resultsSelector, pageFunctionParams, pageFunction, saveFunction, clicks = [] } = param;

    const page = await browser.newPage();
    // for jan
    // console.log("agent:", await browser.userAgent());
    // Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/73.0.3679.0 Safari/537.36
    await page.setUserAgent(config.userAgent);

    // do not request image.
    // see https://pptr.dev/#?product=Puppeteer&version=v1.12.2&show=api-pagesetrequestinterceptionvalue
    await page.setRequestInterception(true);

    page.on('request', request => {
        if (request.resourceType() === 'image')
          request.abort();
        else
          request.continue();
        // if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg'))
        //     interceptedRequest.abort();
        // else
        //     interceptedRequest.continue();
   });
 
    await page.goto(url);
    // console.log("puppeteer loaded.");
    // await page.screenshot({path: 'example.png'});

    // for debug
    if (enableBrowserConsole) {
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    }

    // before click
    if (clicks) {
        // NG code
        // for (const clickSelector of clicks) {
        //     console.log("click:", clickSelector);
        //     await page.waitForSelector(clickSelector);
        //     // await page.click(click);
        //     await page.$eval(clickSelector, element => {
        //         console.log("click elementName:", element.className);
        //         console.log("click elementValue:", element.textContent);
        //         element.click();
        //     });
        // }
        for (const clickSelector of clicks) {
            // console.log("clickSelector:", clickSelector);
            await page.waitForSelector(typeof clickSelector === "string" ? clickSelector : clickSelector.selector);
            // await page.click(clickSelector);    // Error: Node is either not visible or not an HTMLElement
            // NG // Error: Node is either not visible or not an HTMLElement
            // const inputElement = await page.$(clickSelector);
            // await inputElement.click();

            // await page.evaluate(() => {debugger;});

            // OK
            await page.evaluate(clickSelector => {
                if (typeof clickSelector === "string") {
                    // console.log("clickSelector string:", clickSelector);
                    document.querySelector(clickSelector).click();
                } else {
                    // console.log("clickSelector object:", clickSelector);
                    // セレクタ命名規則違反のためやむなくインデックス指定
                    document.querySelectorAll(clickSelector.selector)[clickSelector.index].click();
                }
            }, clickSelector);

            // TODO 状態変化を簡易視したいが…今は逃げる
            await page.waitFor(1000);
            // await page.waitFor(selectorOrFunctionOrTimeout[, options[, ...args]])
        }
    }

    await page.waitForSelector(resultsSelector);
    // await page.evaluate(() => {debugger;});

    const results = await page.$$eval(resultsSelector, pageFunction, pageFunctionParams);
    // await page.evaluate(() => {debugger;});
    await page.close();

    const price = saveFunction(results);
    if (!price) {
        console.error("result:", url, pageFunctionParams.keyword, price);
    }

    return { name, url, price };
};

const crawlSites = async (sites, browser) => {

    const nowTime = Date.now();

    let resultItems = [];

    try {
        // Promise version
        const promises = [];
        for (const param of sites) {
            promises.push(crawl(browser, param));
        }

        const results = await Promise.all(promises);
        // filter failed data
        const items = [];
        for (const result of results) {
            if (!result || Number.isNaN(Number.parseInt(result.price))) {
                // follow recovery case.(fail safe)
                throw Error(`価格取得失敗:${result ? result.url : ""}`);
                // ignore case.(fail soft)
                // continue;
            }
            items.push(result);
        }
        resultItems = items;
    }
    catch (e) {
        console.error(e);
    } finally {
        // 規定時間未満の連続アクセス防止
        const processTime = (Date.now() - nowTime);
        if (processTime < crawlDuration) {
            console.log('sleep...');
            await sleep(crawlDuration - processTime);
        }
        return resultItems;
    }

    // each crawl version
    // for (const param of item.sites) {
    //     // 取得できないサイトは飛ばして全体の妨げにならないようにする
    //     try {
    //         const result = await crawl(browser, param);
    //         if (!Number.parseInt(result))
    //             throw Error("価格取得失敗", param);
    //         resultItems.push(result);
    //     }
    //     catch (e) {
    //         console.error(e);
    //     }
    // }
}

const crawlMain = async (browser, items, result, resultFailed) => {
    for (const item of items) {
        const { id, name, sku, url, ogimg, price, brand, release, sites } = item;

        const resultItems = await crawlSites(sites, browser);
        // store failed item
        if (resultItems.length <= 0) {
            resultFailed.items.push({ id, name, });
            continue;
        }

        resultItems.sort((a, b) => b.price - a.price);
        console.log("resultItems:", resultItems);
        // important: get after sorted
        const bestprice = resultItems[0].price;
        const percentage = Number.parseInt(bestprice / price * 100);

        // Abnormal value detection
        // if (percentage > 200 || percentage < 20) {   // 新製品は0円になることがある。低い分には悪影響ないので解除
        if (percentage > 200) {
            // required manual action
            console.error(`パーセンテージ異常:${item.name}`);
            resultFailed.items.push({ id, name, });
            continue;
        }

        // TODO 差分更新に対応する場合、push()ではなくresult.items[id] = {}とすること

        result.items.push({
            // static data
            id, name, sku, url, ogimg, price, brand,
            // dynamic data
            release,
            bestprice,
            percentage,
            timestamp: Date.now(),
            sites: resultItems
        });
    }
};

(async () => {    
    let browser = { close: () => { } };
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            // for debug
            // headless: false,
            // devtools: true
        });
        // NG sample
        // await sites.forEach(async (site) => {
        //     await crawl(browser, param);
        // });
        // for (const site in sites) {
        //     for (const param of site) {
        //         await crawl(browser, param);
        //     }
        // }
        console.log("isDev:", isDev);

        const items = isRecovery ? getSelectItems(readFailedItems().items) : getItems();
        const timestamp =  Date.now();
        const result = {
            items: isRecovery ? readItems().items : [],
            brands: getBrands(),
            timestamp, ownership: config.url,
        };
        const resultFailed = { items: [], timestamp };

        // TODO 差分更新に対応する場合、効率を考えると一旦オブジェクトに変換したいところ。
        // 差分更新のシナリオ
        // 1.1  recoveryロジックを利用して、latest.json(Array)をロード
        //        result.items = readItems().items;
        // 1.2  1.1をObjectに変換
        //        // Array => Object
        //        params.forEach(value => result[value.key?] = value);
        // 2.   差分Items(restore同様実質Idsになるだろう)のロード＜＝高頻度抽出は別途検討
        //        readFailedItems().itemsレベルもの
        // 3.   2の差分高頻度更新データをcrawl
        //        await crawlMain(browser, getSelectItems(readFailedItems().items), result, resultFailed);
        // 4.1. 3の結果をObjectに変換
        //        // Array => Object
        //        const diffItems = result.items.forEach(value => resultDiff[value.key?] = value);
        // 4.2. 4.1の結果を1.2に上書き（取得分のみ更新）
        //        diffItems.forEach(value => result[value.key?] = value);
        // 5.1. 4.2の結果をArrayに変換
        //        // Object => Array
        //        const params = Object.keys(result).map(key => ({ ...result[key], key}));
        // 5.2. price順にソートして差分更新完了
        //        result.items.sort((a, b) => b.percentage - a.percentage);
        // 6.   Function化によるサイト単位の処理になった場合に難易度アップ？Function化も併せて要検討

        // Function化
        // 優先事項としては、将来的に規模が大きくなってもロジックの大きな修正不要、コストは二の次でOK。
        // ・ローカル同様にアイテム単位で取得
        //   △単純に現状の並列実行だとメモリが足りない都合、並列数を制限が前提。シングルプロセスのためクロールサイトが多くなるとつらくなってくる。
        //   △待ち時間のコストは無駄が多そう。
        //   〇ローカルプログラムと共有部分多い。
        // ・サイトごとにFunctionを割り当てる
        //   △サイトへのアクセス間隔の管理が単純。一方で待ち時間のコストは無駄になる。
        //   △ローカルプログラムとは作りが大きく変わる可能性あり。
        // ・サイトごと更にアイテムごとにFunctionを割り当てる
        //   △サイトへのアクセス間隔の管理が複雑（1アイテムごとに次のキューを投げる？）。一方で待ち時間のコストは最適化される。(ブラウザ起動のオーバーヘッドは要検証)
        //   △ローカルプログラムとは作りが大きく変わる可能性あり。


        await crawlMain(browser, items, result, resultFailed);
        // for dev
        // no store
        if (isDev) {
            return;
        }

        // retry failed items
        if (!isRecovery) {
            console.log("failed items:", resultFailed.items);
            // store and refresh resultFailed
            writeJsonToFailedFile(resultFailed);
            resultFailed.items = [];
            // retry crawl
            await crawlMain(browser, getSelectItems(readFailedItems().items), result, resultFailed);
        }
        // sort for front
        result.items.sort((a, b) => b.percentage - a.percentage);

        const time = (Date.now() - timestamp) / 1000;
        console.log(`main succeded:${time}s`);

        // store result
        writeJsonToFile(result);
        // about fail result
        console.log("failed items:", resultFailed.items);
        if (resultFailed.items.length > 0) {
            writeJsonToFailedFile(resultFailed);
            // If it fails, the server does not update.
        } else {
            deleteFailedFile();
            // update data of firebase
            await updateItems(result);
            // uddate data of firestorage
            await uploadItems();
        }

    } catch (e) {
        console.error(e);
        // throw e;
    } finally {
        console.log(`main finally`);
        browser.close();
    }
})();

