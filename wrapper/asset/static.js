const fs = require("fs");
const path = require("path");

module.exports = function (req, res, url) {
	if (req.method != 'GET' || !url.path.startsWith('/animation') && !url.path.startsWith('/static') && !url.path.startsWith('/store')) return;
	res.end(fs.readFileSync(path.join(__dirname, "../../server", url.path)));
	return true;
}