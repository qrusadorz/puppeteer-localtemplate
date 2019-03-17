const sitemap = require('sitemap');
const fs = require('fs');
const { config } = require('./configs/config');

// TODO config
const hostname = config.url;
const sitemapFilename = "sitemap.xml";
const jsonFilename = "latest.json";

const writeSitemapToFile = sitemap => {
    fs.writeFileSync(sitemapFilename, sitemap);
}

const readSitemapFromFile = () => {
    const sitemap = fs.readFileSync(sitemapFilename);
    return sitemap;
}

const readJsonFromFile = () => {
    const json = fs.readFileSync(jsonFilename);
    return JSON.parse(json);
}

const createUrls = (items) => {
    const urls = [
        {
            url: `/`,
            changefreq: 'daily',
            priority: 1,
        }
    ];
    for (const item of items) {
        urls.push({
            url: `/items/${item.id}`,
            changefreq: 'daily',
        });
    }
    return urls;
}

(async () => {
    const { items } = readJsonFromFile();
    const urls = createUrls(items);

    const result = sitemap.createSitemap({
        hostname, cacheTime: 600000, urls,
    });

    writeSitemapToFile(result.toString());
    console.log("", readSitemapFromFile().toString());
})();
