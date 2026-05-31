const formidable = require('formidable');
const fs = require('fs');
const parse = require("../data/parse");
const database = require("../data/database"), DB = new database();

module.exports = function (req, res, url) {
	if (req.method != 'POST' || url.path != '/api/movie/delete') return;
	new formidable.IncomingForm().parse(req, (e, f) => {
		try {
			const ttsIDS = parse.getTTSIds(fs.readFileSync(`./_SAVED/${f.id}.xml`));
			const db = DB.get();
			for (const ids of ttsIDS) {
				const index = db.assets.findIndex(i => i.id == ids);
				db.assets.splice(index, 1);
				fs.readdirSync('./_ASSETS').forEach(file => {
					if (file.includes(ids)) fs.unlinkSync(`./_ASSETS/${file}`);
				});
			}
			fs.unlinkSync(`./_SAVED/${f.id}.xml`);
			fs.unlinkSync(`./_SAVED/${f.id}.png`);
			fs.existsSync(`./_WATERMARKS/${f.id}.txt`) ? fs.unlinkSync(`./_WATERMARKS/${f.id}.txt`) : "";
			if (db.movies.find(i => i.id == f.id)) {
				const index = db.movies.findIndex(i => i.id == f.id);
				db.movies.splice(index, 1);
			}
			DB.save(db);
			res.end(JSON.stringify({status: "ok"}));
		} catch (e) {
			console.log(e);
			res.end(JSON.stringify({status: "error"}));
		}
	});
	return true;
}