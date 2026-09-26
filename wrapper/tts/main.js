const https = require("https");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const qs = require("querystring");
const md5 = require("js-md5");
const ffmpeg = require("fluent-ffmpeg");

const info = require("./info.json");
const voices = info.voices;

const get = require("../request/get");

ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);

const VOICEFORGE_SERVER_URL = "https://voiceforge-tcvi.onrender.com";

/**
 * Generate WAV audio from VoiceForge.
 *
 * Returns a Buffer rather than a Readable stream.
 * This is important because the WAV will be written to a
 * real temporary file before being passed to FFmpeg.
 */
function voiceForgeGenerateSpeech(text, voice) {
	return new Promise((resolve, reject) => {
		const body = JSON.stringify({
			text,
			voice
		});

		const url = new URL(`${VOICEFORGE_SERVER_URL}/generate`);

		const req = https.request(
			{
				hostname: url.hostname,
				port: url.port || 443,
				path: url.pathname,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(body)
				}
			},
			(r) => {
				const buffers = [];

				r.on("data", (chunk) => {
					buffers.push(chunk);
				});

				r.on("end", () => {
					const responseBody = Buffer.concat(buffers);

					if (
						r.statusCode < 200 ||
						r.statusCode >= 300
					) {
						let message =
							`Voice Forge server returned HTTP ${r.statusCode}.`;

						try {
							const json = JSON.parse(
								responseBody.toString()
							);

							if (json.error) {
								message += ` ${json.error}`;
							} else if (json.message) {
								message += ` ${json.message}`;
							}
						} catch (e) {
							// Keep the generic HTTP error.
						}

						return reject(new Error(message));
					}

					resolve(responseBody);
				});

				r.on("error", reject);
			}
		);

		req.on("error", reject);
		req.end(body);
	});
}

/**
 * Convert a WAV Buffer to MP3 using real temporary files.
 *
 * Using files here avoids passing an in-memory Readable to code
 * that expects a filesystem-backed stream/fd.
 */
async function convertWavBufferToMp3(wavBuffer) {
	const tempDir = await fs.promises.mkdtemp(
		path.join(os.tmpdir(), "voiceforge-")
	);

	const wavPath = path.join(tempDir, "input.wav");
	const mp3Path = path.join(tempDir, "output.mp3");

	try {
		await fs.promises.writeFile(wavPath, wavBuffer);

		await new Promise((resolve, reject) => {
			ffmpeg(wavPath)
				.audioCodec("libmp3lame")
				.format("mp3")
				.on("error", reject)
				.on("end", resolve)
				.save(mp3Path);
		});

		return await fs.promises.readFile(mp3Path);
	} finally {
		// Clean up temporary files/directories.
		await new Promise((resolve) => {
			fs.rmdir(tempDir, { recursive: true }, () => resolve());
		});
	}
}

module.exports = function tts(voiceName, text, headers) {
	return new Promise(async (resolve, reject) => {
		const voice = voices[voiceName];

		if (!voice) {
			return reject(new Error("That voice doesn't seem to exist"));
		}

		try {
			switch (voice.source) {
				/* -------------------- VOCALWARE -------------------- */
				case "vocalware": {
					const [eid, lid, vid] = voice.arg;

					const cs = md5(
						`${eid}${lid}${vid}${text}1mp35883747uetivb9tb8108wfj`
					);

					const q = qs.encode({
						EID: eid,
						LID: lid,
						VID: vid,
						TXT: text,
						EXT: "mp3",
						IS_UTF8: 1,
						ACC: 5883747,
						cache_flag: 3,
						CS: cs
					});

					https.get(
						{
							host: "cache-a.oddcast.com",
							path: `/tts/gen.php?${q}`,
							headers: {
								Referer: "https://www.oddcast.com/",
								Origin: "https://www.oddcast.com/",
								"User-Agent": headers["user-agent"]
							}
						},
						(r) => {
							const buffers = [];

							r.on("data", (d) => buffers.push(d));

							r.on("end", () => {
								resolve(Buffer.concat(buffers));
							});

							r.on("error", reject);
						}
					);

					break;
				}

				/* -------------------- VOICEFORGE -------------------- */
				case "voiceforge": {
					try {
						// Get the WAV as a Buffer.
						const wavBuffer = await voiceForgeGenerateSpeech(
							text,
							voice.arg
						);

						// Convert using real temporary files.
						const mp3Buffer =
							await convertWavBufferToMp3(wavBuffer);

						resolve(mp3Buffer);
					} catch (e) {
						reject(e);
					}

					break;
				}

				/* -------------------- CEPSTRAL -------------------- */
				case "cepstral": {
					https.get(
						"https://www.cepstral.com/en/demos",
						(r) => {
							const cookie = r.headers["set-cookie"];

							const q = qs.encode({
								voiceText: text,
								voice: voice.arg,
								createTime: 666,
								rate: 170,
								pitch: 1,
								sfx: "none"
							});

							const buffers = [];

							https.get(
								{
									host: "www.cepstral.com",
									path: `/demos/createAudio.php?${q}`,
									headers: {
										Cookie: cookie
									}
								},
								(r) => {
									r.on("data", (b) =>
										buffers.push(b)
									);

									r.on("end", async () => {
										try {
											const json = JSON.parse(
												Buffer.concat(
													buffers
												).toString()
											);

											const data = await get(
												`https://www.cepstral.com${json.mp3_loc}`
											);

											resolve(data);
										} catch (e) {
											reject(e);
										}
									});

									r.on("error", reject);
								}
							).on("error", reject);
						}
					).on("error", reject);

					break;
				}

				/* -------------------- READLOUD -------------------- */
				case "readloud": {
					const body = new URLSearchParams({
						but1: text,
						butS: 0,
						butP: 0,
						butPauses: 0,
						butt0: "Submit"
					}).toString();

					const requestHeaders = {
						"User-Agent": "Mozilla/5.0",
						Referer: "https://readloud.net",
						Origin: "https://readloud.net"
					};

					const req = https.request(
						{
							hostname: "readloud.net",
							path: voice.arg,
							method: "POST",
							headers: {
								"Content-Type":
									"application/x-www-form-urlencoded",
								...requestHeaders
							}
						},
						(r) => {
							if (r.statusCode !== 200) {
								return reject(
									new Error(
										`HTTP ${r.statusCode}`
									)
								);
							}

							let html = "";

							r.on("data", (b) => {
								html += b;
							});

							r.on("end", () => {
								const beg = html.indexOf("/tmp/");

								if (beg === -1) {
									return reject(
										new Error(
											"MP3 link not found"
										)
									);
								}

								const end = html.indexOf(
									"mp3",
									beg
								);

								if (end === -1) {
									return reject(
										new Error(
											"MP3 link not found"
										)
									);
								}

								const sub = html.substring(
									beg,
									end + 3
								);

								https.get(
									{
										hostname: "readloud.net",
										path: sub,
										headers: requestHeaders
									},
									(r2) => {
										if (
											r2.statusCode !== 200
										) {
											return reject(
												new Error(
													`MP3 HTTP ${r2.statusCode}`
												)
											);
										}

										const buffers = [];

										r2.on("data", (chunk) =>
											buffers.push(chunk)
										);

										r2.on("end", () => {
											resolve(
												Buffer.concat(
													buffers
												)
											);
										});

										r2.on("error", reject);
									}
								).on("error", reject);
							});

							r.on("error", reject);
						}
					);

					req.on("error", reject);
					req.end(body);

					break;
				}

				default: {
					return reject(
						new Error("Not implemented")
					);
				}
			}
		} catch (e) {
			return reject(e);
		}
	});
};