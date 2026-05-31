/***
 * asset api
 */
const fs = require("fs");
const database = require("../data/database"), DB = new database();
const folder = `${__dirname}/../../${process.env.ASSET_FOLDER}`;
const fUtil = require("../fileUtil");
const https = require("https");

module.exports = {
	delete(aId, type) {
		let type2;
		if (!type) type2 = "assets";
		else type == "folder" ? type2 = "folders" : type2 = type;
		// remove info from database
		const db = DB.get();
		const met = db[type2].find(i => i.id == aId);
		let folder2;
		for (const stuff in met) if (stuff == "folder") folder2 = met.folder;
		const index = db[type2].findIndex(i => i.id == aId);
		db[type2].splice(index, 1);
		DB.save(db);
		// find file by id and delete it
		if (type == 'folder') {
			try {
				fs.rmdirSync(`${folder}/folders/${aId}`);
			} catch (e) {
				const files = [];
				const db = DB.get();
				fs.readdirSync(`${folder}/folders/${aId}`).forEach(file => {
					fs.unlinkSync(`${folder}/folders/${aId}/${file}`)
					const index = db.assets.findIndex(i => i.id == file.split(".")[0]);
					db.assets.splice(index, 1);
					files.push(file);
				});
				DB.save(db);
				fs.rmdirSync(`${folder}/folders/${aId}`);
				return files;
			}
		} else fs.readdirSync(folder).forEach(file => {
			if (file.includes(aId)) {
				if (fs.existsSync(`${folder}/${file}`)) fs.unlinkSync(`${folder}/${file}`);
				else if (fs.existsSync(`${folder}/folders/${folder2}/${file}`)) fs.unlinkSync(`${folder}/folders/${folder2}/${file}`);
			}
		});
	},
	list(type, subtype = null, tId = null) { // very simple thanks to the database
		const db = DB.get();
		const table = [];
		let aList = db.assets.filter(i => i.type == type);
		// more filters
		if (subtype) aList = aList.filter(i => i.subtype == subtype);
		if (tId) aList = aList.filter(i => i.themeId == tId);
		for (const stuff of aList) if (!stuff.folder) table.unshift(stuff);
		if (type == "char") return aList;
		else return table;
	},
	listInFolder(foldername) { // very simple thanks to the database
		const db = DB.get();
		let aList = db.assets.filter(i => i.folder == foldername);
		return aList.filter(i => i.type == "prop");
	},
	getFileCount(foldername) { 
		let count = 0;
		fs.readdirSync(`${folder}/folders/${foldername}`).forEach(() => {
			count++
		});
		return count;
	},
	listFolders() {
		return DB.get().folders;
	},
	load(aId) { // look for match in folder
		var match = false;
		fs.readdirSync(folder).forEach(filename => {
			if (filename.search(aId) !== -1) match = filename;
		})
		return match ? fs.readFileSync(`${folder}/${match}`) : null;
	},
	meta(aId) {
		const met = DB.get().assets.find(i => i.id == aId);
		if (!met) {
			console.error("Asset metadata doesn't exist! Asset id:", aId);
			return {status: "error", msg: "invalid_asset"};
		}
		return { // return only the important metadata
			status: "ok",
			data: met
		};
	},
	save(buf, meta) {
		// save asset info
		const aId = fUtil.generateId();
		const db = DB.get();
		db.assets.unshift({ // base info, can be modified by the user later
			id: aId,
			enc_asset_id: aId,
			themeId: meta.tId,
			type: meta.type,
			subtype: meta.subtype,
			title: meta.title,
			published: "",
			share: {
				type: "none"
			},
			tags: "",
			duration: meta.duration,
			file: `${aId}.${meta.ext}`,
			signature: ""
		});
		DB.save(db);
		// save the file
		fs.writeFileSync(`${folder}/${aId}.${meta.ext}`, buf);
		meta.file = `${aId}.${meta.ext}`;
		meta.enc_asset_id = meta.id = aId;
		if (meta.type == "sound" || meta.type == "video") fs.writeFileSync(`${folder}/${aId}.png`, fs.readFileSync(`./wrapper/pages/img/importer/${meta.type}.png`));
		return aId;
	},
	update(newInf) {
		// set new info and save
		const db = DB.get();
		const met = db.assets.find(i => i.id == newInf.movieId || newInf.id ? newInf.id.includes(".") ? newInf.id.split(".")[0] : newInf.id : newInf.assetId ? newInf.assetId.includes(".") ? newInf.assetId.split(".")[0] : newInf.assetId : '');
		for (const stuff in newInf) if (stuff != "updatingFromHTML") met[stuff] = newInf[stuff];
		if (newInf.updatingFromHTML && met.share) {
			met.share = {
				type: newInf.share
			}
		}
		console.log(newInf);
		if ((newInf.tags && newInf.tags.includes("_public")) || (newInf.updatingFromHTML && newInf.share == "team")) return {
			error: true,
			msg: "In order to upload your asset as a public one, you need to request one of the Vyond Remastered Developers to help you get your asset public."
		};
		else {
			DB.save(db);
			return {
				ok: true
			};
		}
	},
	updateFolder(newInf) {
		// set new info and save
		const db = DB.get();
		const met = db.folders.find(i => i.id == newInf.id);
		if (newInf.updatingFromHTML) met.name = newInf.title;
		else for (const stuff in newInf) met[stuff] = newInf[stuff];
		DB.save(db);
		return true;
	}
};
