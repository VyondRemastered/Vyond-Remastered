const formidable = require("formidable");
const character = require('./main');

module.exports = function (req, res) {
	switch (req.method) {
		case "GET": {
			const match = req.url.match(/\/characters\/([^.]+)(?:\.xml)?$/);
			if (!match) return;

			var id = match[1];
			res.setHeader('Content-Type', 'text/xml; charset=UTF-8');
			process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
			character.load(id).then(v => { res.statusCode = 200, res.end(v) })
				.catch(e => { res.statusCode = 404, res.end(e) })
			return true;
		}

		case "POST": {
			if (req.url != "/goapi/getCcCharCompositionXml/") return;

			new formidable.IncomingForm().parse(req, async (err, fields, files) => {
				if (err) {
					res.statusCode = 500;
					return res.end("1");
				}

				const assetId = fields.assetId || fields.original_asset_id;
				console.log("Loading character:", assetId);

				try {
					const buffer = await character.load(assetId);

					res.statusCode = 200;
					res.setHeader("Content-Type", "text/xml; charset=UTF-8");

					// Flash requires the 0 prefix
					res.end("0" + buffer.toString("utf8"));
				} catch (e) {
					console.error(e);
					res.statusCode = 404;
					res.end("1");
				}
			});

			return true;
		}
	}
}