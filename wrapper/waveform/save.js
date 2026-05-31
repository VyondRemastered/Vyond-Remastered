/***
 * waveform save route
 */
const formidable = require('formidable');
const wf = require("./main");

module.exports = function (req, res, url) {
	if (req.method != "POST" || url.path != "/goapi/saveWaveform/") return;
	new formidable.IncomingForm().parse(req, async (e, f, files) => {
		const waveform = f.waveform, aId = f.wfid;
		wf.save(waveform, aId);
		res.end("0");
	});
	return true;
}
