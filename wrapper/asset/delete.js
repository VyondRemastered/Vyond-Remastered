/***
 * asset metadata route
 */
const asset = require("./main");
const formidable = require("formidable");
const fs = require("fs");
const info = JSON.parse(fs.readFileSync('./wrapper/static/info.json'));

module.exports = function (req, res, url) {
	if (req.method != "POST") return;
	switch (url.pathname) {
		case "/api_v2/asset/delete/": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				try {
					asset.delete(f.id || f.data.id);
					res.end(JSON.stringify({status: "ok"}));
				} catch (err) {
					console.error("Error deleting asset: " + err);
					res.end(JSON.stringify({status: "error", msg: "Error deleting asset: " + err}));
				}
			});
			break;
		} case "/api/info/get": {
			res.end(JSON.stringify(info));
			break;
		} case "/api/info/update": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				info.GET["/index.html"].headers.Location = f.build;
				info.GET["/$"].headers.Location = f.build;
				info.GET["/dashboard/videos"].headers.Location = f.build;
				fs.writeFileSync('./wrapper/static/info.json', JSON.stringify(info, null, "\t"));
				res.end();
			});
			break;
		}
		case "/goapi/deleteUserTemplate/":
		case "/goapi/deleteAsset/": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				try {
					asset.delete(f.templateId || f.id);
					res.end('0');
				} catch (err) {
					console.error(err);
					res.statusCode = 500;
					res.end(1 + err);
				}
			});
			break;
		} default: return;
	}
	return true;
}
