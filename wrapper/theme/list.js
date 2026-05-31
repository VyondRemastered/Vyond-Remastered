/* Looking for a written form of the themes list?
"action"
"akon"
"animal"
"anime"
"ben10"
"botdf"
"bunny"
"cc_store"
"chibi"
"chowder"
"christmas"
"common"
"custom"
"domo"
"fullenergy"
"monkeytalk"
"monstermsh"
"ninja"
"ninjaanime"
"politic"
"politics2"
"retro"
"sf"
"space"
"spacecitizen"
"startrek"
"stick"
"sticklybiz"
"street"
"underdog"
"vietnam"
"willie"
*/

const fUtil = require("../fileUtil.js");
const folder = process.env.THEME_FOLDER;
const Database = require("../data/database"); // no 
const DB = new Database(true);

module.exports = function (req, res, url) {
	if (req.method !== "POST" || url.path !== "/goapi/getThemeList/") return;

	const db = DB.get();
	res.setHeader("Content-Type", "application/zip");

	const file =
		db.year === "2016"
			? `${folder}/themelist.xml`
			: `${folder}/themelist_2015.xml`;

	fUtil
		.zippy(file, "themelist.xml")
		.then((b) => res.end(b))
		.catch((e) => {
			res.statusCode = 500;
			res.end(String(e));
		});

	return true;
};
