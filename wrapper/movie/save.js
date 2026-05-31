const formidable = require('formidable');
const movie = require("./main");
const fs = require("fs");

module.exports = function (req, res, url) {
	if (req.method != "POST" || url.path != "/goapi/saveMovie/") return;
	new formidable.IncomingForm().parse(req, async (e, f, files) => {
		let thumb;
		if (!f.thumbnail_large) {
			if (fs.existsSync(`./pages/img/themes/${f.tray}.png`)) thumb = fs.readFileSync(`./pages/img/themes/${f.tray}.png`);
			else if (fs.existsSync(`./pages/img/themes/${f.tray}.jpg`)) thumb = fs.readFileSync(`./pages/img/themes/${f.tray}.jpg`);
		} else thumb = Buffer.from(f.thumbnail_large, "base64");
		var body = Buffer.from(f.body_zip, "base64");
		movie.save(body, thumb, f.presaveId, f.diferentLVM).then(nId => res.end("0" + nId)).catch(e => 
			res.end("1" + `<error><code>ERR_ASSET_404</code><message>${e}</message><text></text></error>`)
		);
	});
	return true;

}
