const { masterItems } = require('./masteritems')

const getItems = (paramObject, resultsSelector, pageFunction, saveFunction) => {
    // Object => Array
    const params = Object.keys(paramObject).map(key => ({ ...paramObject[key], key}));
    // not work now.
    // return Object.fromEntries(params.map(value => (value.keyword ? [value.key, {
    //     // id: masterItems[value.masterItemId].name,
    //     url: value.url,
    //     keyword: masterItems[value.key].sku,
    //     resultsSelector: value.resultsSelector ? value.resultsSelector : resultsSelector,
    //     pageFunction: value.pageFunction ? value.pageFunction : pageFunction,
    //     saveFunction
    // }] : [value.key, {
    //     ...value,
    //     resultsSelector: value.resultsSelector ? value.resultsSelector : resultsSelector,
    //     pageFunction: value.pageFunction ? value.pageFunction : pageFunction,
    //     saveFunction
    // }])));
    const result = {};
    params.map(value => ({
        key: value.key,// id: masterItems[value.masterItemId].name,
        url: value.url,
        keyword: value.keyword || masterItems[value.key].sku,   // for production
        // keyword: value.keyword || (masterItems[value.key] ? masterItems[value.key].sku : "") ,  // for dev
        exactkeyword: value.exactkeyword || null, // 完全一致キーワードを求めるもの
        regexp: value.regexp || "", // 表形式で途中の金額取得時
        clicks: value.clicks || null,   // clickが必要なもの
        resultsSelector: value.resultsSelector || resultsSelector,
        pageFunction: value.pageFunction || pageFunction,
        saveFunction
    })).forEach(value => {
        if (!value.url) return;
        result[value.key] = value;
    });
    // console.log("result:", result);
    return result;
}

module.exports = { getItems };
