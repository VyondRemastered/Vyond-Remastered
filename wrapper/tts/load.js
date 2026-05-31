const formidable = require("formidable");
const mp3Duration = require("mp3-duration");
const voices = require("./info").voices;
const asset = require("../asset/main");
const tts = require("./main.js");
const http = require("http");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "POST" || url.path != "/goapi/convertTextToSoundAsset/") return;
	new formidable.IncomingForm().parse(req, async (e, f, files) => {
		tts(f.voice, f.text, req.headers).then((buffer) => {
			mp3Duration(buffer, (e, d) => {
				var dur = d * 1e3;
				if (e || !dur) {
					console.log(e || "Error: Unable to retrieve MP3 stream.");
					return res.end(1 + `<error><code>ERR_ASSET_404</code><message>${e || "Unable to retrieve MP3 stream."}</message><text></text></error>`);
				}
				const title = `[${voices[f.voice].desc}] ${f.text}`;
				const meta = {
					type: "sound",
					subtype: "tts",
					title,
					duration: dur,
					ext: "mp3",
					tId: "ugc"
				}
				const id = asset.save(buffer, meta);
				res.end(`0<response><asset><id>${id}.mp3</id><enc_asset_id>${id}.mp3</enc_asset_id><type>sound</type><subtype>tts</subtype><title>${title}</title><published>0</published><tags></tags><duration>${dur}</duration><downloadtype>progressive</downloadtype><file>${id}.mp3</file></asset></response>`);
			});
		}).catch((e) => {
			console.log(e)
			res.end(1 + `<error><code>ERR_ASSET_404</code><message>${e}</message><text></text></error>`)
		});
	});
	return true;
};
