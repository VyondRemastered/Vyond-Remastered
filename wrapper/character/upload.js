/***
 * character upload route
 */
const formidable = require('formidable');
const parse = require('../data/parse');
const fUtil = require('../fileUtil');
const char = require("../character/main");
const fs = require('fs');

module.exports = function (req, res, url) {
	if (req.method != 'POST' || url.path != '/upload_character') return;
	new formidable.IncomingForm().parse(req, (e, f, files) => {
		const path = files.import.path || files.import.filepath;
		const buffer = fs.readFileSync(path);
		const beg = buffer.indexOf(`theme_id="`) + 10;
		const end = buffer.indexOf(`"`, beg);
		const theme = buffer.subarray(beg, end).toString();
		const numId = char.save(buffer, {
			type: "char",
			subtype: 0,
			title: "Untitled",
			ext: "xml",
			tId: theme
		});
		fs.unlinkSync(path);

		res.statusCode = 302;
		const url = `/cc_browser?themeId=${theme}`
		res.setHeader('Location', url);
		res.end();
	});
	return true;
}