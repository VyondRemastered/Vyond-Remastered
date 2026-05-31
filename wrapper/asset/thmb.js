const thumbUrl = process.env.THUMB_BASE_URL;
const path = require("path");
const fs = require("fs");

module.exports = function (req, res, url) {
	if (req.method != 'GET' || !url.path.startsWith('/stock_thumbs')) return;
    res.end(fs.readFileSync(path.join(__dirname, "../../server", `${thumbUrl}/${url.path.substr(url.path.lastIndexOf("/") + 1)}`)));
	return true;
}
