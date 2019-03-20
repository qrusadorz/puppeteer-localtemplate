const { masterItems, getBrands } = require('../items/masteritems')
const masterSites = [
// for production

    // for dev
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

const buildItems = masteritems => {
    const result = [];
    for (const masteritem of masteritems) {
        const { key, name, url, ogimg = "", price, sku = "", brand = "" } = masteritem;
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
