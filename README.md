# zesty-wp-sync

- WordPress endpoint: https://content-api-prod.nba.com/public/1/teams/1610612756/content?type=article
- Zesty Content Model: https://8-84fbb1fd87-qm8d2d.manager.zesty.io/schema/6-ca888defe0-75x5pk

Pull WP articles.
Pull Zesty articles content model.
Iterate through Zesty articles and check that the article_id field does not exist in the id field of the all WP articles.
Check that the "status" of the WP article is "publish"

Create the Zesty item.

When creating the Zesty item, the article_tagss field will be a string where the WP articles array: taxonomy.tags will need to be iterated through.

change
https://data-test.nba.com/data/v2022/json/mobile_teams/nba/2022/teams/suns_schedule.json
to
https://data.nba.com/data/v2022/json/mobile_teams/nba/2022/teams/suns_schedule.json
On oct. 11

to sync games manually use this url: https://zesty-games-sync-skszk6q72q-uc.a.run.app
