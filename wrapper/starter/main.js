/***
 * starter api
 */
const fs = require("fs");
const database = require("../data/database"), DB = new database();
const nodezip = require('../zip/main');
const folder = `${__dirname}/../../${process.env.ASSET_FOLDER}`;
const fUtil = require("../fileUtil");
const movie = require("../movie/main");
const parse = require("../data/parse");

module.exports = {
	load(mId) {
		return new Promise((res, rej) => {
			let filePath = `${folder}/${mId}.xml`;
			console.log(filePath);
			if (!fs.existsSync(filePath)) rej("Starter doesn't exist.");

			const buffer = fs.readFileSync(filePath);
			parse.packXml(buffer, mId).then(v => res(v));
		});
	},
	save(movieZip, thumb, id) {
		return new Promise((res, rej) => {
			if (!id) id = fUtil.generateId();
			// save the thumbnail
			fs.writeFileSync(`${folder}/${id}.png`, thumb);
			// extract the movie xml and save it
			const zip = nodezip.unzip(movieZip);
			let writeStream = fs.createWriteStream(`${folder}/${id}.xml`);
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
					if (DB.save(db)) {
						movie.meta(id, true).then(m => {
							const db = DB.get();
							const info = {}
							for (const stuff in m) {
								if (stuff == "duration" || stuff == "durationString" || stuff == "date") continue;
								info[stuff] = m[stuff];
							}
							const info2 = {
								enc_asset_id: id,
								type: "movie",
								sceneCount: 0,
								tags: "",
								file: `${id}.xml`,
								share: {
									type: "none"
								},
								assetId: id
							}
							for (const stuff in info2) info[stuff] = info2[stuff];
							db.assets.unshift(info);
							DB.save(db);
							res(info);
						});
					};
				});
			});
		});
	},
};
