const fs = require('fs');
const stuff = JSON.parse(fs.readFileSync('./wrapper/static/info.json'));

module.exports = function (req, res, url) {
	var methodLinks = stuff[req.method];
	for (let linkIndex in methodLinks) {
		var regex = new RegExp(linkIndex);
		if (regex.test(url.path)) {
			var t = methodLinks[linkIndex];
			var link = t.regexLink ? url.path.replace(regex, t.regexLink) : t.link || url.path;
			var headers = t.headers;
			var path = `./wrapper/${link}`;

			try {
				for (var headerName in headers || {}) res.setHeader(headerName, headers[headerName]);
				res.statusCode = t.statusCode || 200;
				if (t.content !== undefined) {
					if (headers["Content-Type"] != "application/json") res.end(t.content);
					else res.end(JSON.stringify(t.content));
				} else if (fs.existsSync(path)) fs.createReadStream(path).pipe(res);
				else throw null;
			} catch (e) {
				console.log(e);
				res.statusCode = t.statusCode || 404;
				res.end();
			}
			return true;
		}
	}
	return false;
};
