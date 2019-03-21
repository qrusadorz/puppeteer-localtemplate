const { masterItems, getBrands } = require('../items/masteritems')
const masterSites = [
    // for production
    require('./1-chome'),   // table
    require('./1ban'),      // table
    require('./about'),     // search
    require('./dram'),      // table mac型番不一致のためMacなし
    require('./god'),       // search
    require('./io'),        // search
    require('./jan'),       // search
    require('./kaikun'),    // search
    require('./mix'),       // table puppteer bugでカラム中の文字列が取れないことがある。
    require('./rakuen'),    // table
    require('./star'),      // table
    // require('./twink'),      // 未 どれが正しいのか不明のため
    require('./wiki'),      // search

    // for dev
    // require('./dram'),
];

const crypto = require('crypto');

// const md5hex = (str) => {
//     const md5 = crypto.createHash('md5').update(str, 'binary').digest('hex');
//     const base64 = crypto.createHash('md5').update(str, 'binary').digest('base64');
//     console.log(`md5[${md5}]=>base64[${base64}]`);
//     // return md5;
//     return base64;
// };

const md5ToBase64url = (str) => crypto.createHash('md5').update(str, 'binary').digest('base64')
    .replace(/=+/g, '') // delete padding
    .replace(/\++/g, '-').replace(/\/+/g, '_'); // convert base64 to base64url
    // base64url test data
    // MacBook 256GB シルバー MNYH2J/A
    // MacBook 512GB シルバー MNYJ2J/A

const buildItems = masteritems => {
    const result = [];
    for (const masteritem of masteritems) {
        const { key, name, url, ogimg = "", price, sku = "", brand = "", release = "" } = masteritem;
        const sites = [];
        for (const site of masterSites) {
            const item = site[key];
            if (!item) continue;
            sites.push(item);
        }
        if (sites.length < 1) continue; // possibly a bug, but also a new product.
        const uniqname = `${name} ${sku}`;
        result.push({
            id: md5ToBase64url(uniqname),
            name: uniqname,
            url, ogimg, 
            price: Number.parseInt(price * 1.08),   // add tax
            sites,
            // schema関連
            brand, sku,
            // 新製品判定
            release,
        });
    }
    // console.log("result:", result);
    return result;
}

const getItems = () => {
    // Object => Array
    const masteritems = Object.keys(masterItems).map(key => ({...masterItems[key], key}));
    // console.log("masteritems", masteritems);
    return buildItems(masteritems);
};

const getSelectItems = (idItems) => {
    const masteritems = getItems();
    console.log("idItems:", idItems);
    // get master item with sites.
    const result = [];
    for (const item of idItems) {
        // 非効率だけど数が少ない想定なので許容する
        const masterItem = masteritems.find(value => item.id === value.id);
        result.push(masterItem);
    }
    console.log("getSelectItems result:", result);
    return result;
};

module.exports = { getItems, getSelectItems, getBrands };
