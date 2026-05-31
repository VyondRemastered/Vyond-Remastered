const fs = require("fs");

module.exports = function (req, res, url) {
	if (req.method != "GET" || !url.path.startsWith("/assets")) return;
	res.end(fs.readFileSync(`./_ASSETS/${url.path.substr(url.path.lastIndexOf("/") + 1)}`));
	return true;
}