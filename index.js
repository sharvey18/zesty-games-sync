const SDK = require("@zesty-io/sdk");
const fetch = require("node-fetch");
const util = require("util");
require("env-yaml").config({ path: ".env.yaml" });

// console.log(process.env.GAME_ENDPOINT);
const sdk = new SDK(process.env.ZESTY_INSTANCE_ZUID, process.env.ZESTY_TOKEN);

async function getSunsGames() {
  let res = await fetch(process.env.GAME_ENDPOINT);
  return await res.json();
}

async function getZestyGames() {
  return await sdk.instance.getItems(process.env.ZESTY_MODEL);
}

// run iteration check against zesty and wp articles

async function run(res) {
  const zestyGames = await getZestyGames();
  const sunsGames = await getSunsGames();
  let total = 0;
  sunsGames.data.gscd.g.map(async (game) => {
    // check zesty games for the id
    let insertGame = zestyGames.data.find((zestyGame) => {
      return zestyGame.data.game_id === game.gid;
    });
    let check = typeof insertGame === "undefined";
    if (check) {
      await createItem(game);
      total++;
    }
  });
  res.send(`synced games`);
}

async function createItem(game) {
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

exports.zestyGamesSync = async (req, res) => {
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
