/***
 * character save route
 */
const formidable = require('formidable');
const char = require("./main");

module.exports = function (req, res, url) {
	if (req.method != "POST") return;
	switch (url.path) {
		case "/goapi/saveCCCharacter/": { // save all
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				// check for missing data
				if (!f.body || !f.thumbdata || !f.themeId) res.statusCode = 400, res.end(1 + "missing char data");
				try {
					const id = char.save(f.body, {
						type: "char",
						subtype: 0,
						title: "Untitled",
						ext: "xml",
						tId: f.themeId
					}, f.noCopy, f.original_asset_id);
					char.saveThumb(Buffer.from(f.thumbdata, "base64"), id);
					res.end("0" + id);
				} catch (err) {
					console.error("Error saving character: " + err);
					res.statusCode = 500;
					res.end("1" + err);
				}
			});
			break;
		}
		case "/goapi/saveCCThumbs/": { // save stock thumbnail
			new formidable.IncomingForm().parse(req, async (e, f, files) => res.end(0 + f.assetId));
			break;
		}
		default:
			return;
	}
	return true;
}