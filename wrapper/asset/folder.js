const fs = require("fs");

module.exports = function (req, res, url) {
	const match = url.path.match(/\/folders\/([^/]+)\/([^/]+)$/);
	if (!match) return;
	const name = match[1];
	const id = match[2];
	fs.readdirSync(`${__dirname}/../../${process.env.ASSET_FOLDER}/folders/${name}`).forEach(file => {
		if (file.includes(id)) res.end(fs.readFileSync(`${__dirname}/../../${process.env.ASSET_FOLDER}/folders/${name}/${file}`));
	});
	return true;
}