const https = require("https");
const http = require("http");
const { Readable } = require("stream");
const qs = require("querystring");
const fs = require("fs");
const path = require("path");
const md5 = require("js-md5");
const ffmpeg = require("fluent-ffmpeg");

const info = require("./info.json");
const voices = info.voices;

const get = require("../request/get");
const fileUtil = require("../fileUtil");

ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);

module.exports = function tts(voiceName, text, headers) {
	return new Promise(async (resolve, reject) => {
		const voice = voices[voiceName];
		if (!voice) return reject("That voice doesn't seem to exist");

		try {
			switch (voice.source) {
				/* -------------------- VOCALWARE -------------------- */
				case "vocalware": {
					const [eid, lid, vid] = voice.arg;
					const cs = md5(`${eid}${lid}${vid}${text}1mp35883747uetivb9tb8108wfj`);

					const q = qs.encode({
						EID: eid,
						LID: lid,
						VID: vid,
						TXT: text,
						EXT: "mp3",
						IS_UTF8: 1,
						ACC: 5883747,
						cache_flag: 3,
						CS: cs,
					});

					https.get(
						{
							host: "cache-a.oddcast.com",
							path: `/tts/gen.php?${q}`,
							headers: {
								Referer: "https://www.oddcast.com/",
								Origin: "https://www.oddcast.com/",
								"User-Agent": headers["user-agent"],
							},
						},
						(r) => {
							const buffers = [];
							r.on("data", (d) => buffers.push(d));
							r.on("end", () => resolve(Buffer.concat(buffers)));
							r.on("error", reject);
						}
					);
					break;
				}

				/* -------------------- CEPSTRAL -------------------- */
				case "cepstral": {
					https.get("https://www.cepstral.com/en/demos", (r) => {
						const cookie = r.headers["set-cookie"];
						const q = qs.encode({
							voiceText: text,
							voice: voice.arg,
							createTime: 666,
							rate: 170,
							pitch: 1,
							sfx: "none",
						});

						const buffers = [];
						https.get(
							{
								host: "www.cepstral.com",
								path: `/demos/createAudio.php?${q}`,
								headers: { Cookie: cookie },
							},
							(r) => {
								r.on("data", (b) => buffers.push(b));
								r.on("end", async () => {
									const json = JSON.parse(Buffer.concat(buffers).toString());
									try {
										const data = await get(`https://www.cepstral.com${json.mp3_loc}`);
										resolve(data);
									} catch (e) {
										reject(e);
									}
								});
							}
						);
					});
					break;
				}

				/* -------------------- READLOUD -------------------- */
				case "readloud": {
					const req = https.request(
						{
							hostname: "readloud.net",
							path: voice.arg,
							method: "POST",
							headers: {
								"Content-Type": "application/x-www-form-urlencoded",
								"User-Agent": "Mozilla/5.0",
								"Referer": "https://readloud.net",
								"Origin": "https://readloud.net"
							},
						},
						(res) => {
							try {
								if (res.statusCode !== 200) {
									return reject(
										"ReadLoud error occurred when generating audio"
									);
								}

								const buffers = [];

								res.on("data", (b) => buffers.push(b));

								res.on("end", () => {
									try {
										const html = Buffer.concat(buffers);

										const beg = html.indexOf("/tmp/");
										const end = html.indexOf("mp3", beg) + 3;

										const sub = html.subarray(beg, end).toString();

										const audioReq = https.get(
											`https://readloud.net${sub}`,
											(audioRes) => {
												if (audioRes.statusCode !== 200) {
													return reject(
														"ReadLoud error occurred when retrieving audio"
													);
												}

												const audioBufs = [];
												audioRes.on("data", (b) => audioBufs.push(b));
												audioRes.on("end", () => resolve(Buffer.concat(audioBufs)));
												audioRes.on("error", reject);
											}
										);

										audioReq.on("error", reject);
									} catch (e) {
										reject(e);
									}
								});
							} catch (e) {
								reject(e);
							}
						}
					);

					req.on("error", reject);

					const body = new URLSearchParams({
						but1: text,
						butS: "0",
						butP: "0",
						butPauses: "0",
						butt0: "Submit",
					}).toString();

										req.end(body);

					break;
				}

				default:
					reject(`Unsupported voice source: ${voice.source}`);
					break;
			}
		} catch (e) {
			reject(e);
		}
	});
};