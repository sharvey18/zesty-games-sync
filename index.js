const SDK = require("@zesty-io/sdk");
const fetch = require("node-fetch");
const util = require("util");
require("env-yaml").config({ path: ".env.yaml" });
// 1. Get zesty articles
// 2. get wp articles
// 3. check if wp article status is "publish"
// 4. check article id
// 5. create article in zesty for any ids that do not exist
// 5.1 when creating an article looping through wp article tags to create array within zesty article in article_tagss field

// console.log(process.env.WP_ENDPOINT);
const articleLimit = 5;
const sdk = new SDK(process.env.ZESTY_INSTANCE_ZUID, process.env.ZESTY_TOKEN);

async function getWPArticles() {
  let res = await fetch(process.env.WP_ENDPOINT + "&count=" + articleLimit);
  return await res.json();
}

async function getZestyArticles() {
  return await sdk.instance.getItems(process.env.ZESTY_MODEL);
}

// run iteration check against zesty and wp articles

async function run(res) {
  const zestyArticles = await getZestyArticles();
  const wpArticles = await getWPArticles();
  let total = 0;
  // console.log(wpArticles);
  // console.log(zestyArticles);
  wpArticles.results.items.map(async (article) => {
    // check zesty articles for the id
    let insertArticle = zestyArticles.data.find((zestyArticle) => {
      console.log(zestyArticle.data.article_id);
      console.log(article.id);
      return zestyArticle.data.article_id === article.id;
    });
    let check = typeof insertArticle === "undefined";
    if (check) {
      await createItem(article);
      total++;
    }
  });
  res.send(`synced ${total} articles`);
}

async function createItem(article) {
  try {
    const newItem = await sdk.instance.createItem(process.env.ZESTY_MODEL, {
      data: {
        article_id: article.id,
        article_link: article.permalink,
        article_title: article.title,
        article_author: article?.author?.name
          ? article.author.name
          : "Phoenix Suns",
        article_publish_date: article.date,
        article_header: article.featuredImage.src,
        article_excerpt: article.excerpt,
        article_tagss: article?.taxonomy?.tags
          ? Object.keys(article.taxonomy.tags).join(",")
          : "",
      },
      web: {
        canonicalTagMode: 1,
        metaLinkText: article.title,
        metaTitle: article.title,
        metaDescription: article.excerpt.substr(0, 159),
      },
    });

    console.log(newItem);
  } catch (err) {
    console.trace(err);
  }
}

exports.zestyWPSync = async (req, res) => {
  // Set CORS headers for preflight requests
  // Allows GETs from any origin with the Content-Type header
  // and caches preflight response for 3600s

  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204);
  } else {
    await run(res);
  }
};
