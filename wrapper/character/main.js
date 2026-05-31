const xNumWidth = parseInt(process.env.XML_NUM_WIDTH);
const fXml = process.env.FAILURE_XML;
const { padZero, generateId } = require('../fileUtil');
const fw = parseInt(process.env.FILE_WIDTH);
const path = require("path"), folder2 = path.join(__dirname, "../../server/characters");
const fs = require('fs');
const database = require("../data/database"), DB = new database();
const folder = `${__dirname}/../.${process.env.ASSET_FOLDER}`;

module.exports = {
	/**
	 * @param {string} id
	 * @returns {Promise<string>}
	 */
	getTheme(id) {
		return new Promise((res, rej) => {
			this.load(id).then(buffer => {
				const beg = buffer.indexOf(`theme_id="`) + 10;
				const end = buffer.indexOf(`"`, beg);
				res(buffer.subarray(beg, end).toString());
			}).catch(rej);
		});
	},
	list(tId) { // very simple thanks to the database
		const aList = DB.get().assets.filter(i => i.type == "char" && i.themeId == tId);
		return aList;
	},
	/**
	 * @param {string} id
	 * @returns {Promise<Buffer>}
	 */
	load(id) {
		return new Promise((res, rej) => {
			try {
				res(fs.readFileSync(`${folder}/${id}.xml`));
			} catch (err) { // Blank prefix is left for compatibility purposes.
				console.log("Character doesn't exist. Loading as stock char...")
				const nId = Number.parseInt(id);
				const xmlSubId = nId % fw, fileId = nId - xmlSubId;
				const lnNum = padZero(xmlSubId, xNumWidth);
				// DO NOT pad filename
				const idPad0 = padZero(fileId, 9);
				const chars = fs.readFileSync(`${folder2}/${idPad0}.txt`, "utf8");
				var line = chars.toString('utf8').split('\n').find(v => v.substr(0, xNumWidth) == lnNum);
				line ? res(Buffer.from(line.substr(xNumWidth))) : rej(Buffer.from(fXml));
			}	
		});
	},
	/** 
	 * @param {Buffer} buf
	 * @param {string} id
	 * @returns {Promise<string>}
	 */
	save(buf, meta, noCopy = false, original_asset_id) {
		let id;
		// save asset info
		if (!noCopy) id = generateId();
		else id = original_asset_id;
		const db = DB.get();
		const met = { // base info, can be modified by the user later
			id: id,
			enc_asset_id: id,
			themeId: meta.tId,
			type: meta.type,
			subtype: meta.subtype,
			title: meta.title,
			published: "0",
			share: {
				type: "none"
			},
			tags: "",
			file: `${id}.${meta.ext}`
		}
		if (!noCopy) db.assets.unshift(met);
		DB.save(db);
		// save the file
		fs.writeFileSync(`${folder}/${id}.${meta.ext}`, buf);
		return id;
	},
	/** 
	 * @param {Buffer} buf
	 * @param {string} id
	 * @returns {string}
	 */
	saveThumb(buf, id) {
		// save the file
		fs.writeFileSync(`${folder}/${id}.png`, buf);
		return id;
	},
}