/**
 * asset load route
 */
const formidable = require("formidable");
const fUtil = require("../fileUtil");
const Asset = require("./main");
const fs = require("fs");
const path = require("path");

module.exports = function (req, res, url) {
	switch (req.method) {
		case "GET": {
			const match = req.url.match(/\/(assets|goapi\/getAsset)\/([^/]+)$/);
			if (!match) return;

			const aId = match[2]; // get asset id
			const b = Asset.load(aId);
			b ? (res.statusCode = 200, res.end(b)) :
				(res.statusCode = 404, res.end());
			return true;
	}
	case "POST": {
			switch (url.pathname) {
				case "/goapi/getAssetEx/":
				case "/goapi/getAsset/": {
					new formidable.IncomingForm().parse(req, (e, f) => {
						if (e || !f) {
							res.statusCode = 400;
							return res.end();
						}
						const aId = f.assetId || f.enc_asset_id;
						if (!aId) {
							res.statusCode = 400;
							return res.end();
						}
						const b = Asset.load(aId);
						if (b) {
							res.setHeader("Content-Length", b.length);
							res.end(b);
						} else {
							res.statusCode = 404;
							res.end();
						}
					});
					return true;
				} default: return;
			}
		}
		default: return;
	}
}