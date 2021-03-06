const { masterItems } = require('./masteritems')

const getItems = (paramObject, resultsSelector, pageFunction, saveFunction, name) => {
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
        name: name,
        url: value.url,
        pageFunctionParams: {
            // keyword: value.keyword || masterItems[value.key].sku,   // for production
            keyword: value.keyword || (masterItems[value.key] ? masterItems[value.key].sku : "") ,  // for dev // TODO 4/2　発売禁止のためしばらくproduction化
            exactkeyword: value.exactkeyword || null, // 完全一致キーワードを求めるもの
            index: value.index, // querySelectAll()の後のターゲットとなるElementのIndex
            regexp: value.regexp || "", // 表形式で途中の金額取得時
        },
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
