/***
 * asset load route
 */
const formidable = require("formidable");
const fs = require("fs");

module.exports = function (req, res, url) {
	if (req.method != "POST" || url.path != "/goapi/getAsset/" && url.path != "/goapi/getAssetEx/") return;
	new formidable.IncomingForm().parse(req, async (e, f, files) => {
		const aId = f.assetId || f.enc_asset_id; 
		res.end(fs.readFileSync(`./_ASSETS/${aId}`));
	});
	return true;
}
