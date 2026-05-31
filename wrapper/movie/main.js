const parse = require('../data/parse');
const fUtil = require('../fileUtil');
const nodezip = require('../zip/main');
const fs = require('fs');
const database = require("../data/database"), DB = new database();
const path = require("path");
function folder(isStarter = false) {
    const f = isStarter ? process.env.ASSET_FOLDER : process.env.SAVED_FOLDER;
    return path.join(__dirname, "../../", f)
}

module.exports = {
	/**
	 *
	 * @param {Buffer} movieZip
	 * @param {string} nëwId
	 * @param {string} oldId
	 * @returns {Promise<string>}
	 */
	save(movieZip, thumb, id, diferentLVM = false) {
		return new Promise((res, rej) => {
			try {
				// save the thumbnail
				if (thumb) fs.writeFileSync(`${folder()}/${id}.png`, thumb);
				// extract the movie xml and save it
				const zip = nodezip.unzip(movieZip);
				let writeStream = fs.createWriteStream(`${folder()}/${id}.xml`);
				parse.unpackZip(zip, thumb, id).then(data => {
					writeStream.write(data, () => {
						writeStream.close();
						var dateObj = new Date();
						var month = dateObj.getUTCMonth() + 1; 
						var day = dateObj.getUTCDate();
						var year = dateObj.getUTCFullYear();
						const db = DB.get();
						db.movieDates[id] = {
							date: `${month}/${day}/${year}`
						};
						DB.save(db);
						if (diferentLVM) {
							this.meta(id).then(m => {
								const db = DB.get();
								const meta = db.movies.find(i => i.id == id);
								if (!meta) db.movies.unshift(m);
								else for (const stuff in m) meta[stuff] = m[stuff];
								DB.save(db);
							});
						}
						res(id);
					});
				}).catch(rej);
			} catch (e) {
				rej(e);
			}
		});
	},
	loadZip(mId) {
		return new Promise((res, rej) => {
			let filePath = `${folder()}/${mId}.xml`;
			if (!fs.existsSync(filePath)) rej("Movie doesn't exist.");

			const buffer = fs.readFileSync(filePath);
			parse.packXml(buffer, mId).then(res);
		});
	},
	thumb(mId) {
		return new Promise((res, rej) => {
			const fn = `${folder()}/${mId}.png`;
			try {
				res(fs.readFileSync(fn))
			} catch (e) {
				rej(e);
			}
		});
	},
	list() {
		const f = folder();
		const array = [];
		fs.readdirSync(f).forEach(fn => {
			if (!fn.includes(".xml")) return;
			const mId = fn.substring(0, fn.length - 4);
			const movie = fs.existsSync(`${folder()}/${mId}.xml`);
			const thumb = fs.existsSync(`${folder()}/${mId}.png`);
			if (movie && thumb) array.push(mId);
		});
		return array;
	},
	async meta(mId, isStarter = false) {
		try {
			try {
				const db = DB.get();
				const fn = `${folder(isStarter)}/${mId}.xml`;
				const buffer = fs.readFileSync(fn);
				const begTitle = buffer.indexOf('<title>') + 16;
				const endTitle = buffer.indexOf(']]></title>');
				const title = buffer.slice(begTitle, endTitle).toString().trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

				const begDuration = buffer.indexOf('duration="') + 10;
				const endDuration = buffer.indexOf('"', begDuration);
				const duration = Number.parseFloat(buffer.slice(begDuration, endDuration));
				const min = ('' + ~~(duration / 60)).padStart(2, '0');
				const sec = ('' + ~~(duration % 60)).padStart(2, '0');
				const durationStr = `${min}:${sec}`;
				return {
					date: db.movieDates[mId] ? db.movieDates[mId].date : "",
					durationString: durationStr,
					duration,
					title: title || "Untitled Video",
					id: mId,
				};
			} catch (e) {
				const db = DB.get();
				const fn = `${folder()}/${mId}.xml`;
				const buffer = fs.readFileSync(fn);
				const begTitle = buffer.indexOf('<title>') + 16;
				const endTitle = buffer.indexOf(']]></title>');
				const title = buffer.slice(begTitle, endTitle).toString().trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

				const begDuration = buffer.indexOf('duration="') + 10;
				const endDuration = buffer.indexOf('"', begDuration);
				const duration = Number.parseFloat(buffer.slice(begDuration, endDuration));
				const min = ('' + ~~(duration / 60)).padStart(2, '0');
				const sec = ('' + ~~(duration % 60)).padStart(2, '0');
				const durationStr = `${min}:${sec}`;
				return {
					date: db.movieDates[mId] ? db.movieDates[mId].date : "",
					durationString: durationStr,
					duration,
					title: title || "Untitled Video",
					id: mId,
				};
			}
		} catch (e) {
			console.log(e);
		}
	},
}
