const SDK = require("@zesty-io/sdk");
const fetch = require("node-fetch");
const util = require("util");
require("env-yaml").config({ path: ".env.yaml" });

async function getSunsGames() {
  let res = await fetch(process.env.GAME_ENDPOINT);
  return await res.json();
}

async function getZestyGames(sdk) {
  return await sdk.instance.getItems(process.env.ZESTY_MODEL);
}

// run iteration check against zesty and wp articles

async function run(res) {
  const auth = new SDK.Auth();
  const session = await auth.login(
    process.env.ZESTY_USER_EMAIL,
    process.env.ZESTY_USER_PASSWORD
  );
  // console.log(process.env.GAME_ENDPOINT);
  const sdk = new SDK(process.env.ZESTY_INSTANCE_ZUID, session.token);
  const zestyGames = await getZestyGames(sdk);
  const sunsGames = await getSunsGames();
  let total = 0;
  sunsGames.data.gscd.g.map(async (game) => {
    let item, version, zuid;
    // check zesty games for the id
    let insertGame = zestyGames.data.find((zestyGame) => {
      return zestyGame.data.game_id === game.gid;
    });
    // if the game doesn't exist create it
    let check = typeof insertGame === "undefined";
    if (check) {
      item = await createItem(sdk, game);
      zuid = item.data.ZUID;
      version = 1;
      total++;
    } else {
      // if game does exist then update it
      await updateItem(sdk, insertGame, game);
      zuid = insertGame.meta.ZUID;
      version = insertGame.meta.version + 1;
      total++;
    }
    // console.log("Version", process.env.ZESTY_MODEL, zuid, version);
    let publish = await sdk.instance.publishItem(
      process.env.ZESTY_MODEL,
      zuid,
      version
    );
  });
  res.send(`synced games`);
}

async function updateItem(sdk, zestyItem, game) {
  zestyItem.data.game_id = game.gid;
  zestyItem.data.game_code = game.gcode;
  zestyItem.data.game_date = game.gdte;
  zestyItem.data.home_team_time = game.htm;
  zestyItem.data.visitor_team_time = game.vtm;
  zestyItem.data.eastern_time = game.etm;
  zestyItem.data.arena_name = game.an;
  zestyItem.data.arena_city = game.ac;
  zestyItem.data.arena_state = game.as;
  zestyItem.data.game_status = game.st;
  zestyItem.data.game_status_text = game.stt;
  zestyItem.data.visiting_team_record = game.v.re;
  zestyItem.data.visiting_team_abbreviation = game.v.ta;
  zestyItem.data.visiting_team_name = game.v.tn;
  zestyItem.data.visiting_team_city = game.v.tc;
  zestyItem.data.visiting_team_score = game.v.s;
  zestyItem.data.home_team_record = game.h.re;
  zestyItem.data.home_team_abbreviation = game.h.ta;
  zestyItem.data.home_team_name = game.h.tn;
  zestyItem.data.home_team_score = game.h.s;
  zestyItem.data.home_team_city = game.h.tc;
  try {
    const updateItem = await sdk.instance.updateItem(
      process.env.ZESTY_MODEL,
      zestyItem.meta.ZUID,
      zestyItem
    );

    console.log(updateItem);
  } catch (err) {
    console.trace(err);
  }
}

async function createItem(sdk, game) {
  try {
    const newItem = await sdk.instance.createItem(process.env.ZESTY_MODEL, {
      data: {
        game_id: game.gid,
        game_code: game.gcode,
        game_date: game.gdte,
        home_team_time: game.htm,
        visitor_team_time: game.vtm,
        eastern_time: game.etm,
        arena_name: game.an,
        arena_city: game.ac,
        arena_state: game.as,
        game_status: game.st,
        visiting_team_record: game.v.re,
        visiting_team_abbreviation: game.v.ta,
        visiting_team_name: game.v.tn,
        visiting_team_city: game.v.tc,
        home_team_record: game.h.re,
        home_team_abbreviation: game.h.ta,
        home_team_name: game.h.tn,
        home_team_city: game.h.tc,
      },
      web: {
        canonicalTagMode: 1,
        metaLinkText: `${game.v.tn} vs ${game.h.tn}`,
        metaTitle: `${game.v.tn} vs ${game.h.tn}`,
        metaDescription: `${game.v.tn} vs ${game.h.tn}`,
      },
    });

    console.log(newItem);
  } catch (err) {
    console.trace(err);
  }
}

exports.zestyGamesSyncUpdate = async (req, res) => {
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
