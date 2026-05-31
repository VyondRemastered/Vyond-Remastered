/***
 * asset metadata route
 */
const asset = require("./main");
const formidable = require("formidable");
const fs = require("fs");
const info = JSON.parse(fs.readFileSync('./wrapper/static/info.json'));
const fUtil = require("../fileUtil");
const database = require("../data/database"), DB = new database();

module.exports = function (req, res, url) {
	if (req.method != "POST") return;
	switch (url.path) {
		case "/api_v2/asset/get": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				const m = asset.meta(f.data.starter_id || f.data.id);
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify(m));
			});
			break;
		} 
		case "/api_v2/asset/update/": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				if (f.updatingFromHTML) {
					if (!f.title) {
						res.statusCode = 302;
						res.setHeader("Location", `/error?err=Asset ${f.id} needs to have a name. please try again later.`);
						return res.end();
					}
					const status = asset.update(f);
					if (status.ok) {
						res.statusCode = 302;
						res.setHeader("Location", "/");
						res.end();
					} else {
						res.statusCode = 302;
						res.setHeader("Location", `/error?err=${status.msg}`);
						res.end();
					}
				} else {
					const status = asset.update(f.data, req.headers);
					if (status.ok) {
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({status: "ok"}));
					} else {
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({status: "error", msg: status.msg}));
					}
				}
			});
			break;
		} 
		case "/api_v2/folder/update/": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				const status = asset.updateFolder(f.data || f);
				if (status) {
					if (!f.updatingFromHTML) {
						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({status: "ok"}));
					} else {
						res.statusCode = 302;
						res.setHeader("Location", info.GET["/index.html"].headers.Location);
						res.end();
					}
				}
			});
			break;
		} 
		case "/goapi/updateSysTemplateAttributes/":
		case "/goapi/updateAsset/": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				const status = asset.update(f);
				console.log(status);
				if (status.ok) res.end('0');
				else res.end('1' + status.msg);
			});
			break;
		} case "/api/folder/create": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				let meta = {}, db = DB.get(), id = fUtil.generateId();
				function createFolders() {
					try {
						fs.mkdirSync(`${__dirname}/../../${process.env.ASSET_FOLDER}/folders/${id}`);
						for (const stuff in f) {
							if (stuff == "share") {
								meta.share = {
									type: f.share
								};
							} else meta[stuff] = f[stuff];
						}
						const info2 = {
							id,
							enc_asset_id: id,
							themeId: "ugc",
							name: meta.title,
							published: "",
							tags: "",
						}
						for (const stuff in info2) meta[stuff] = info2[stuff];
						db.folders.unshift(meta);
						DB.save(db);
						return true;
					} catch (e) {
						console.log(e);
						return false;
					}
				}
				if (!f.title) {
					res.statusCode = 302;
					res.setHeader("Location", `/error?err=A folder needs to have a name. Please create a folder with a name.`);
					res.end();
				} else try {
					if (fs.existsSync(`${__dirname}/../../${process.env.ASSET_FOLDER}/folders`)) {
						fs.mkdirSync(`${__dirname}/../../${process.env.ASSET_FOLDER}/folders/${id}`);
						for (const stuff in f) {
							if (stuff == "share") {
								meta.share = {
									type: f.share
								};
							} else meta[stuff] = f[stuff];
						}
						const info2 = {
							id,
							enc_asset_id: id,
							themeId: "ugc",
							name: meta.title,
							published: "",
							tags: "",
						};
						for (const stuff in info2) meta[stuff] = info2[stuff];
						db.folders.unshift(meta);
						DB.save(db);
						res.statusCode = 302;
						res.setHeader("Location", info.GET["/index.html"].headers.Location);
						res.end();
					} else {
						fs.mkdirSync(`${__dirname}/../../${process.env.ASSET_FOLDER}/folders`);
						if (createFolders()) {
							res.statusCode = 302;
							res.setHeader("Location", info.GET["/index.html"].headers.Location);
							res.end();
						} else {
							res.statusCode = 302;
							res.setHeader("Location", `/error?err=There was an error while your folder was being created. Please try again later.`);
							res.end();
						}
					}
				} catch (e) {
					console.log(e);
					res.statusCode = 302;
					res.setHeader("Location", `/error?err=There was an error while your folder was being created. Please try again later.`);
					res.end();
				}
			});
			break;
		} case "/api_v2/folder/delete/": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				try {
					const ids = asset.delete(f.id || f.data.id, 'folder');
					res.end(JSON.stringify({status: "ok", data: ids}));
				} catch (e) {
					console.log(e);
					res.end(JSON.stringify({status: "error", msg: "Error deleting folder: " + e}));
				}
			});
			break;
		} case "/api/prop/assign": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				if (f.asset != "noprops") {
					fs.readdirSync('./_ASSETS').forEach(file => {
						if (file.includes(f.asset)) {
							fs.writeFileSync(`./_ASSETS/folders/${f.folder}/${file}`, fs.readFileSync(`./_ASSETS/${file}`));
							if (fs.existsSync(`./_ASSETS/folders/${f.folder}/${file}`)) fs.unlinkSync(`./_ASSETS/${file}`);
						}
					});
					const db = DB.get();
					const met = db.assets.find(i => i.id == f.asset);
					met.folder = f.folder;
					DB.save(db);
					res.statusCode = 302;
					res.setHeader("Location", info.GET["/index.html"].headers.Location);
					res.end();
				} else {
					res.statusCode = 302;
					res.setHeader("Location", "/error?err=You can't assign a prop if you don't have any.");
					res.end();
				}
			});
			break;
		} case "/api/prop/unassign": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				if (f.asset && f.asset != "noprops") {
					fs.readdirSync(`./_ASSETS/folders/${f.folder}`).forEach(file => {
						if (file.includes(f.asset)) {
							fs.writeFileSync(`./_ASSETS/${file}`, fs.readFileSync(`./_ASSETS/folders/${f.folder}/${file}`));
							if (fs.existsSync(`./_ASSETS/${file}`)) fs.unlinkSync(`./_ASSETS/folders/${f.folder}/${file}`);
						}
					});
					const db = DB.get();
					const met = db.assets.find(i => i.id == f.asset);
					met.folder = "";
					DB.save(db);
					res.statusCode = 302;
					res.setHeader("Location", info.GET["/index.html"].headers.Location);
					res.end();
				} else {
					res.statusCode = 302;
					res.setHeader("Location", "/error?err=You can't unassign a prop if you don't have any.");
					res.end();
				}
			});
			break;
		}
		default:
			return;
	}
	return true;
}
