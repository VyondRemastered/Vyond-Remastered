const header = process.env.XML_HEADER;
const wm = require("./main");
const formidable = require("formidable");
const fs = require("fs");
const database = require("../data/database"), DB = new database();

function listWm() {
	files = wm.list();
	return `${header}<watermarks><watermark id="0dd9pqDBl5b8" thumbnail="/pages/img/list_logo.png"/>${
		files.map(v => `<watermark id="${v.id}" thumbnail="/watermarks/${v.id}"/>`).join("")
	}</watermarks>`;
}

module.exports = function (req, res, url) {
	if (req.method != "POST") return;
	switch (url.path) {
		case "/api/watermarks/list": {
			res.end(JSON.stringify(wm.list()));
			break;
		} case "/goapi/getUserWatermarks/": {
			const watermarks = listWm();
			res.setHeader("Content-Type", "text/html; charset=UTF-8");
			res.end(watermarks);
			break;
		} case "/goapi/getMovieInfo/": { // load a watermark xml from an existing text file if it exists. otherwise, don't load any watermarks.
			new formidable.IncomingForm().parse(req, async (e, f, files) => res.end(fs.existsSync(`${__dirname}/../.${process.env.WATERMARKS_FOLDER}/${f.movieId}.txt`) ? fs.readFileSync(`${
				__dirname
			}/../.${process.env.WATERMARKS_FOLDER}/${f.movieId}.txt`) : `<watermarks><watermark style="davidscreation"/></watermarks>`));
			break;
		} case "/api/database/get": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => res.end(JSON.stringify(DB.get()[f.type])));
			break;
		} case "/api/database/meta": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				const db = DB.get();
				const met = db[f.type].find(i => i.id == f.id);
				res.end(JSON.stringify(met));
			});
			break;
		} default: return;
	}
	return true;
}
