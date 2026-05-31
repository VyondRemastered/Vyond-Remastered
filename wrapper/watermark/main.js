/***
 * watermark api
 */
const fs = require("fs");
const folder = `${__dirname}/../.${process.env.WATERMARKS_FOLDER}`;
const fUtil = require("../fileUtil");

module.exports = {
	list() {
		const table = [];
		fs.readdirSync(folder).forEach(file => {
			if (!file.includes(".txt")) table.unshift({id: file});
		})
		return table;
	},
	save(buf, ext) {
		const aId = fUtil.generateId();
		// save the file
		fs.writeFileSync(`${folder}/${aId}.${ext}`, buf);
		return aId;
	},
	assign(aId, mId) { // create watermark xmls and assign them to each movie id.
		switch (aId) {
			case "0vTLbQy9hG7k": { // goanimate watermark
				fs.writeFileSync(`${folder}/${mId}.txt`, `<watermarks></watermarks>`);
				break;
			} case "0dhteqDBt5nY": { // no watermark
				fs.writeFileSync(`${folder}/${mId}.txt`, `<watermarks><watermark style="davidscreation"/></watermarks>`);
				break;
			} case "0dd9pqDBl5b8": { // any logo that is on the pages folder.
				fs.writeFileSync(`${folder}/${mId}.txt`, `<watermarks><watermark>/pages/img/list_logo.png</watermark></watermarks>`);
				break;
			} default: { // custom watermarks
				fs.writeFileSync(`${folder}/${mId}.txt`, `<watermarks><watermark>/watermarks/${aId}</watermark></watermarks>`);
				break;
			}
		}
	}
};
