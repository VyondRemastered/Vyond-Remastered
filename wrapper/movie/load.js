/***
 * movie load route
 */
const movie = require("./main");
const starter = require("../starter/main");
const base = Buffer.alloc(1, 0);
const database = require("../data/database"), DB = new database(true);

module.exports = function (req, res, url) {
	switch (req.method) {
		case "GET": {
			switch (url.pathname) {
                case "/api/settings/list": {
                    res.end(JSON.stringify(DB.get()));
                    return true;
                }
				case "/api/env/get": {
                    res.end(JSON.stringify(process.env));
                    return true;
                }
            }
			const match = req.url.match(/\/movies\/([^.]+)(?:\.(zip|xml))?$/);
			if (!match) return;

			var id = match[1], ext = match[2];
			switch (ext) {
				case "zip":
					res.setHeader("Content-Type", "application/zip");
					movie.loadZip(id).then(v => { res.statusCode = 200, res.end(v) })
						.catch(e => { res.statusCode = 404, res.end() })
					break;
				default:
					res.setHeader("Content-Type", "text/xml");
					movie.loadXml(id).then(v => { res.statusCode = 200, res.end(v) })
						.catch(e => { res.statusCode = 404, res.end() })
			}
			return true;
		}

		case "POST": {
			if (!url.path.startsWith("/goapi/getMovie/")) return;
			res.setHeader("Content-Type", "application/zip");
			process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

			movie // try movie
				.loadZip(url.query.movieId)
				.then(b => res.end(Buffer.concat([base, b])))
				.catch(err => {
					starter // try starter
						.load(url.query.movieId)
						.then(b => res.end(Buffer.concat([base, b])))
						.catch(err => { // error
							if (process.env.NODE_ENV == "dev") throw err;
							console.error("Error loading movie: " + err)
							res.end("1")
						});
				});
			return true;
		}
		default: return;
	}
}