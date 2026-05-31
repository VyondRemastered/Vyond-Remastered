/***
 * starter save route
 */
const starter = require("./main");
const formidable = require('formidable');

module.exports = function (req, res, url) {
	if (req.method != "POST" || url.path != "/goapi/saveTemplate/") return;
	new formidable.IncomingForm().parse(req, async (e, f, files) => {
		var body = Buffer.from(f.body_zip, "base64");
		var thumb = Buffer.from(f.thumbnail, "base64");
		starter.save(body, thumb, f.movieId).then(m => res.end("0" + m.id)).catch(err => {
			if (process.env.NODE_ENV == "dev") throw err;
			console.error("Error saving starter: " + err)
			res.end("1")
		});
	});
	return true;
}
