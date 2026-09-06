/***
 * asset upload route
 */
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);
ffmpeg.setFfprobePath(require("@ffprobe-installer/ffprobe").path);
const pathModule = require("path");
const os = require("os");
const { fromFile } = require("file-type");
const formidable = require("formidable");
const param3 = Object
const createBubbleThumb = require("./bubble");
const fileTypes = require("./info.json");
const fUtil = require("../fileUtil");
const fs = require("fs");
const mp3Duration = require("mp3-duration");
const asset = require("./main");
const wm = require("../watermark/main");
const database = require("../data/database"), DB = new database();
const nodezip = require("../zip/main");
const { execFile } = require("child_process");

// fs.rm/fs.rmSync only exist from Node 14.14+ - use readdirSync/unlinkSync/
// rmdirSync instead, which have been available since early Node versions.
function rimraf(dir) {
	if (!fs.existsSync(dir)) return;
	for (const entry of fs.readdirSync(dir)) {
		const entryPath = pathModule.join(dir, entry);
		if (fs.statSync(entryPath).isDirectory()) {
			rimraf(entryPath);
		} else {
			fs.unlinkSync(entryPath);
		}
	}
	fs.rmdirSync(dir);
}

function streamToBuffer(r) {
	return new Promise((res, rej) => {
		const buffers = [];
		r.on("data", b => buffers.push(b)).on("end", () => res(Buffer.concat(buffers))).on("error", rej);
	});
}

// Set this to compc from an Apache Flex SDK install - it ships in the
// same bin/ folder as mxmlc (e.g. "/opt/flex-sdk/bin/compc" or
// "C:\\flex-sdk\\bin\\compc.bat").
// font2swf (SWFTools) cannot be used here - it only writes raw SWF tags
// (DefineFont2/3), it has no ActionScript/ABC compiler in it, and
// FontManager.onFontLoaded() requires an actual compiled ActionScript
// class (FontFileCustom<id> with a static getFont()) inside the SWF.
//
// compc, not mxmlc: mxmlc assigns whatever class you compile as the
// SWF's document/root class, which Flash Player tries to instantiate
// and attach to the main timeline the instant the SWF loads. Our class
// extends flash.text.Font, not DisplayObject, so that instantiation is
// invalid - this is almost certainly what was freezing the player.
// compc (the Flex "component compiler") builds library-style SWFs with
// no document class at all, which is the standard, correct way to build
// a runtime-loaded asset SWF that's only ever queried via
// applicationDomain.getDefinition(), never displayed on a timeline.
const COMPC_PATH = process.env.COMPC_PATH || "/opt/flex-sdk/bin/compc";

// compc/mxmlc's default config auto-links the ENTIRE Flex framework
// (framework.swc etc) for every build, even ones that never reference
// mx.*. That framework carries its own mx.core.FlexModuleFactory /
// FlexVersion bootstrap, which runs on load - and since studio.swf
// already has its own copy active (it's Flex-based too, loading our
// font into a child of its own ApplicationDomain per FontManager.init()),
// the second one throws "Compatibility version has already been read."
//
// compc turns out to unconditionally auto-generate an
// IFlexModuleFactory-implementing wrapper as the root class of any
// library it builds - dropping framework.swc from the library path
// entirely just breaks the compile, since compc itself needs those
// interfaces to finish. So instead: keep -library-path restricted to
// playerglobal.swc (nothing of ours gets embedded from the framework),
// but add framework.swc via -external-library-path, which makes it
// available for compc's own type-checking/codegen without embedding its
// bytecode into our output. At runtime, when the loaded font SWF's
// child ApplicationDomain can't find FlexModuleFactory locally, it
// falls through to studio.swf's own already-initialized copy in the
// parent domain instead of carrying a second, conflicting one.
const FLEX_SDK_ROOT = process.env.FLEX_SDK_ROOT || pathModule.resolve(pathModule.dirname(COMPC_PATH), "..");

function findPlayerGlobalSwc(sdkRoot) {
	const playerDir = pathModule.join(sdkRoot, "frameworks", "libs", "player");
	if (!fs.existsSync(playerDir)) return null;
	const versions = fs.readdirSync(playerDir)
		.filter(v => fs.existsSync(pathModule.join(playerDir, v, "playerglobal.swc")))
		.sort((a, b) => parseFloat(b) - parseFloat(a));
	return versions.length ? pathModule.join(playerDir, versions[0], "playerglobal.swc") : null;
}

function findFrameworkLibsDir(sdkRoot) {
	const p = pathModule.join(sdkRoot, "frameworks", "libs");
	return fs.existsSync(p) ? p : null;
}

// Compiles a font file into a SWF containing a FontFileCustom<id> class,
// matching exactly what FontManager.as's onFontLoaded()/getDefinition()
// expects: a static getFont() factory returning a Font whose fontName is
// literally "ugc.<id>" (that's the string isFontLoaded()/updateFontList()
// key everything off of). Extends flash.text.Font directly rather than
// mx.core.FontAsset - no Flex framework SWC needed, just a bare SDK.
function compileFontSwf(fontBuffer, id, ext) {
	return new Promise((resolve, reject) => {
		const tmpDir = fs.mkdtempSync(pathModule.join(os.tmpdir(), "font-build-"));
		const className = `FontFileCustom${id}`;
		const fontSrcPath = pathModule.join(tmpDir, `source.${ext}`);
		const asPath = pathModule.join(tmpDir, `${className}.as`);
		const outSwcPath = pathModule.join(tmpDir, `${className}.swc`);

		const cleanup = () => { try { rimraf(tmpDir); } catch (e) {} };

		fs.writeFileSync(fontSrcPath, fontBuffer);
		fs.writeFileSync(asPath, `package
{
   import mx.core.FontAsset;
   import flash.text.Font;

   [Embed(source="${fontSrcPath.replace(/\\/g, "/")}", fontName="ugc.${id}", mimeType="application/x-font", embedAsCFF="false", unicodeRange="U+0020-007E,U+00A0-00FF")]
   public class ${className} extends FontAsset
   {
      public static function getFont() : Font
      {
         return new ${className}();
      }
   }
}
`);

		const playerGlobalPath = findPlayerGlobalSwc(FLEX_SDK_ROOT);
		const compcArgs = [
			`-source-path=${tmpDir}`,
			`-include-classes=${className}`,
			`-output=${outSwcPath}`,
			"-static-link-runtime-shared-libraries=true"
		];
		if (playerGlobalPath) {
			// Override (not +=) - this drops framework.swc/textLayout.swc/etc
			// from the default library path entirely, leaving only the bare
			// Flash Player API surface our class actually needs.
			compcArgs.push(`-library-path=${playerGlobalPath}`);
		} else {
			console.warn(`Could not locate playerglobal.swc under ${FLEX_SDK_ROOT}/frameworks/libs/player - falling back to compc's default library path, which likely still links the Flex framework and may reproduce the FlexVersion conflict. Set FLEX_SDK_ROOT if your SDK isn't laid out at ${FLEX_SDK_ROOT}.`);
		}
		const frameworkLibsDir = findFrameworkLibsDir(FLEX_SDK_ROOT);
		if (frameworkLibsDir) {
			// External, not embedded: satisfies compc's own auto-generated
			// IFlexModuleFactory/ISWFContext wrapper at compile time without
			// baking framework bytecode into our output SWF. Pointed at the
			// whole libs/ dir (not just framework.swc) since which SWC
			// actually contains ISWFContext varies across SDK builds -
			// compc scans a directory path for all .swc files in it.
			compcArgs.push(`-external-library-path+=${frameworkLibsDir}`);
		} else {
			console.warn(`Could not locate frameworks/libs under ${FLEX_SDK_ROOT} - compc will likely fail to resolve IFlexModuleFactory/ISWFContext. Set FLEX_SDK_ROOT if your SDK isn't laid out at ${FLEX_SDK_ROOT}.`);
		}

		execFile(COMPC_PATH, compcArgs, { timeout: 60000, cwd: tmpDir }, async (err, stdout, stderr) => {
			if (err) {
				cleanup();
				return reject(new Error(stderr || stdout || err.message));
			}
			try {
				// -output ends in .swc deliberately: that's compc's normal
				// library-build mode. Pointing -output at .swf instead
				// switches compc into a special RSL/runtime-module output
				// mode that forces the root class to implement
				// IFlexModuleFactory/ISWFContext - unconditionally, even
				// though our class never uses either. .swc mode has no
				// such wrapper. It's still a ZIP archive containing
				// library.swf, catalog.xml, etc - unzip it and pull the
				// actual SWF back out.
				const swcBuffer = fs.readFileSync(outSwcPath);
				const zip = nodezip.unzip(swcBuffer);
				const libraryEntryName = Object.keys(zip).find(name => name === "library.swf" || name.endsWith("/library.swf"));
				if (!libraryEntryName) {
					cleanup();
					return reject(new Error("compc output did not contain library.swf - got: " + Object.keys(zip).join(", ")));
				}
				const swfBuffer = await streamToBuffer(zip[libraryEntryName].toReadStream());
				cleanup();
				resolve(swfBuffer);
			} catch (readErr) {
				cleanup();
				reject(readErr);
			}
		});
	});
}

// Renders a preview PNG for an uploaded font, the same way the video-prop
// path above generates its screenshot via ffmpeg. Actual rendering
// (opentype.js + sharp) happens in font-thumbnail-worker.js, run as a
// genuine `node` subprocess rather than in-process - sharp's native
// libvips binding crashes with a SIGABRT if it runs inside Electron's
// bundled Node, since that has a different ABI than the one sharp's
// prebuilt binary was compiled against. Set NODE_BIN_PATH if plain
// `node` isn't what's on PATH in your environment.
const NODE_BIN_PATH = process.env.NODE_BIN_PATH || "node";
const FONT_THUMB_WORKER = pathModule.join(__dirname, "font-thumbnail-worker.js");

function generateFontThumbnail(fontBuffer, outPath, sampleText = "Aa") {
	return new Promise((resolve, reject) => {
		const tmpDir = fs.mkdtempSync(pathModule.join(os.tmpdir(), "font-thumb-"));
		const tmpFontPath = pathModule.join(tmpDir, "source-font");
		const cleanup = () => { try { rimraf(tmpDir); } catch (e) {} };

		fs.writeFileSync(tmpFontPath, fontBuffer);

		execFile(NODE_BIN_PATH, [FONT_THUMB_WORKER, tmpFontPath, outPath, sampleText], { timeout: 20000 }, (err, stdout, stderr) => {
			cleanup();
			if (err) return reject(new Error(stderr || stdout || err.message));
			resolve();
		});
	});
}
module.exports = function (req, res, url) {
	if (req.method != "POST") return;
	switch (url.pathname) {
		case "/ajax/saveUserProp": { // asset uploading (legacy)
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				try {
					if (e) res.end(JSON.stringify({suc: false, msg: e}));
					else if (!files) {
						res.end(JSON.stringify({
							suc: false,
							msg: "Please choose a file to upload"
						}));
					} else if (!f) {
						res.end(JSON.stringify({
							suc: false,
							msg: "File upload failed. Missing one or more fields."
						}));
					} else {
						const db = DB.get();
						const id = fUtil.generateId();
						console.log("subtype =", f.subtype);
						// Normalise subtype: legacy template sends "Video" (capital V), lowercase it
						const rawSubtype = (f.subtype || "").toLowerCase();
						let type = rawSubtype == "soundeffect" || rawSubtype == "voiceover" || rawSubtype == "bgmusic" ? "sound" : rawSubtype || "font";
						const file = files.file || files.import;
						const path = file.path || file.filepath;
						const name = file.name || file.originalFilename;
						const dot = name.lastIndexOf(".");
						const ext = name.substr(dot + 1).toLowerCase();
						const folder = process.env.ASSET_FOLDER;

						// Handle video uploads first: convert to FLV and respond immediately
						if (fileTypes.video[ext]) {
							const assetId = fUtil.generateId();
							const oldPath = pathModule.join(folder, `${assetId}.mp4`);
							const newPath = pathModule.join(folder, `${assetId}.flv`);
							fs.copyFileSync(path, oldPath);
							let aId;
							let videoMeta;
							await new Promise((resolve, reject) => {
								ffmpeg.ffprobe(oldPath, (err, data) => {
									if (err) return reject(err);
									ffmpeg(oldPath)
										.output(newPath)
										.on("end", () => {
											videoMeta = {
												type: "prop",
												width: data.streams[0].width,
												height: data.streams[0].height,
												subtype: "video",
												title: name.substring(0, name.lastIndexOf(".")),
												ext: "flv",
												ptype: "placeable",
												tId: "ugc"
											};
											const converted = fs.readFileSync(newPath);
											aId = asset.save(converted, videoMeta);
											const dbNow = DB.get();
											const assetInfo = dbNow.assets.find(v => v.id === aId);
											if (assetInfo) {
												assetInfo.enc_asset_id = `${aId}.flv`;
												assetInfo.id = `${aId}.flv`;
												DB.save(dbNow);
											}
											ffmpeg(oldPath)
												.screenshots({
													timestamps: ["0"],
													filename: `${aId}.png`,
													folder
												})
												.on("end", resolve)
												.on("error", reject);
										})
										.on("error", reject)
										.run();
								});
							});
							fs.unlinkSync(oldPath);
							try { fs.unlinkSync(newPath); } catch(_) {}
							fs.unlinkSync(path);
							const videoAssetId = `${aId}.flv`;
							const videoInfo = {
								suc: true,
								id: videoAssetId,
								asset_type: "prop",
								filename: name,
								asset_data: {
									id: videoAssetId,
									enc_asset_id: videoAssetId,
									themeId: "ugc",
									type: "prop",
									subtype: "video",
									title: videoMeta.title,
									published: "",
									share: { type: "none" },
									tags: "",
									file: videoAssetId,
									signature: "",
									width: videoMeta.width,
									height: videoMeta.height
								}
							};
							res.end(JSON.stringify(videoInfo));
							return;
						}

						const newName = `${id}.${ext}`;
						const buffer = fs.readFileSync(path);
						fs.writeFileSync(`${folder}/${newName}`, buffer);
						const info = {
							suc: true,
							// gives meta for the importer js file to read
							id: newName,
							asset_type: type,
							filename: name,
							asset_data: {
								id,
								enc_asset_id: id,
								themeId: "ugc",
								type,
								subtype: type != "sound" ? 0 : rawSubtype || 0,
								title: name,
								published: "",
								share: {
									type: "none"
								},
								tags: "",
								file: newName,
								signature: ""
							}
						}
						switch (type) {
						case "prop": {
							if (f.redirect && !fileTypes.prop[ext]) {
								res.statusCode = 302;
								res.setHeader(
									"Location",
									`/error?err=File Type (${ext}) is not supported for prop importing.`
								);
								res.end();
								return;
							}
							const propMeta = {
								type: "prop",
								subtype: 0,
								title: name.substring(0, name.lastIndexOf(".")),
								ext,
								ptype: "placeable",
								tId: "ugc"
							};
							asset.save(buffer, propMeta);
							break;
						}
						case "sound": {
							await new Promise((resolve, rej) => {
								mp3Duration(buffer, (e, d) => {
									info.asset_data.duration = 1e3 * d;
									info.asset_data.downloadtype = "progressive";
									resolve();
								});
							})
							break;
						} default: {
							info.thumbnail = `/assets/${newName}`;
							break;
						} 
						}
						db.assets.unshift(info.asset_data);
						DB.save(db);
						res.end(JSON.stringify(info));
						fs.unlinkSync(path);
					}
				} catch (e) {
					console.log(e);
					res.end(JSON.stringify({
						suc: false, 
						msg: "File Upload Failed. Please check your command prompt for more details."
					}));
				}
			});
			return true;
		} case "/api/asset/upload": { // asset uploading
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				const path = files.import.path || files.import.filepath, buffer = fs.readFileSync(path);
				let type = f.type, subtype;
				if (f.type == "soundeffect" || f.type == "voiceover" || f.type == "bgmusic") type = "sound";
				subtype = f.subtype || f.type;
				const name = files.import.name || files.import.originalFilename;
				const ext = name.substring(name.lastIndexOf(".") + 1);
				let meta;
				switch (type) {
					case "sound": {
						if (f.redirect && !fileTypes.sound[ext]) {
							res.statusCode = 302;
							res.setHeader("Location", `/error?err=File Type (${ext}) is not supported for sound importing. please pick a different file type in order to do sound importing.`);
							res.end();
							return;
						}
						await new Promise((resolve, rej) => {
							mp3Duration(buffer, (e, duration) => {
								if (e || !duration) return;
								meta = {
									signature: "",
									type: "sound",
									subtype,
									title: name.substring(0, name.lastIndexOf(".")),
									duration: 1e3 * duration,
									ext: ext,
									tId: "ugc",
									downloadtype: "progressive"
								};
								asset.save(buffer, meta);
								resolve();
							});
						});
						break;
					} case "watermark": { 
						if (!fileTypes.watermark[ext]) { // ico or svg is not supported and will never be.
							res.statusCode = 302;
							res.setHeader("Location", `/error?err=File Type (${ext}) is not supported. even if we supported that type, it would not work correctly on the actual lvm.`);
							res.end();
						} else {
							try { 
								wm.save(buffer, ext);
							} catch (e) { 
								console.log(e); 
							}
							res.statusCode = 302;
							res.setHeader("Location", "/");
							res.end();
						}
						break;
					} case "prop": {
					if (fileTypes.video[ext]) {
					const assetId = fUtil.generateId();
					const folder = process.env.ASSET_FOLDER;

					const oldPath = pathModule.join(folder, `${assetId}.mp4`);
					const newPath = pathModule.join(folder, `${assetId}.flv`);

					fs.copyFileSync(path, oldPath);

					let aId;

					await new Promise((resolve, reject) => {
						ffmpeg.ffprobe(oldPath, (err, data) => {

							if (err) return reject(err);
							ffmpeg(oldPath)
								.output(newPath)
								.on("end", () => {
									meta = {
										type: "prop",
										width: data.streams[0].width,
										height: data.streams[0].height,
										subtype: "video",
										title: name.substring(0, name.lastIndexOf(".")),
										ext: "flv",
										ptype: "placeable",
										tId: "ugc"
									};
									const converted = fs.readFileSync(newPath);
									aId = asset.save(converted, meta);
									const db = DB.get();
									const assetInfo = db.assets.find(v => v.id === aId);

									if (assetInfo) {
										assetInfo.enc_asset_id = `${aId}.flv`;
										assetInfo.id = `${aId}.flv`;
										DB.save(db);
									}

									ffmpeg(oldPath)
										.screenshots({
											timestamps: ["0"],
											filename: `${aId}.png`,
											folder
										})
										.on("end", resolve)
										.on("error", reject);
								})
								.on("error", reject)
								.run();
						});
					});

					fs.unlinkSync(oldPath);
					fs.unlinkSync(newPath);

					break;
				}

				if (f.redirect && !fileTypes.prop[ext]) {
					res.statusCode = 302;
					res.setHeader(
						"Location",
						`/error?err=File Type (${ext}) is not supported for prop importing.`
					);
					res.end();
					return;
				}

				meta = {
					type: "prop",
					subtype: 0,
					title: name.substring(0, name.lastIndexOf(".")),
					ext,
					ptype: "placeable",
					tId: "ugc"
				};

				asset.save(buffer, meta);
				break;
					} case "bg": {
						if (f.redirect && !fileTypes.bg[ext]) {
							res.statusCode = 302;
							res.setHeader("Location", `/error?err=File Type (${ext}) is not supported for background importing. please pick a different file type in order to do background importing.`);
							res.end();
							return;
						}
						meta = {
							type: "bg",
							subtype: 0,
							title: name.substring(0, name.lastIndexOf(".")),
							ext: ext,
							tId: "ugc"
						}
						asset.save(buffer, meta);
						break;
					} case "font": {
						if (f.redirect && !fileTypes.font[ext]) {
							res.statusCode = 302;
							res.setHeader("Location", `/error?err=File Type (${ext}) is not supported for font importing. please pick a different file type in order to do font importing.`);
							res.end();
							return;
						}
						meta = {
							type: "font",
							subtype: 0,
							title: name.substring(0, name.lastIndexOf(".")),
							ext: ext,
							ptype: "placeable",
							tId: "ugc"
						}
						asset.save(buffer, meta);
						// asset.save() fills in meta.id above. FontManager.createFontModel()
						// (called immediately client-side from this very response, before any
						// reload) reads fontPath into FontModel.fontPathURI - same field the
						// reloaded /goapi/getUserFontList/ list needs, so keep both in sync.
						meta.fontPath = `/assets/${meta.id}.swf`;

						try {
							await generateFontThumbnail(buffer, `./_ASSETS/${meta.id}.png`);
							meta.trayImage = `/assets/${meta.id}.png`;
						} catch (thumbErr) {
							// Some uploaded files (e.g. unusual/corrupt font data) opentype.js
							// can't parse. Don't fail the whole import over a missing thumbnail.
							console.error("font thumbnail generation failed:", thumbErr);
						}

						try {
							// Compiled straight from the same original ttf/otf bytes, before
							// anything else touches them. font2swf output is NOT accepted
							// here - see compileFontSwf()'s comment above for why.
							const swfBuffer = await compileFontSwf(buffer, meta.id, ext);
							fs.writeFileSync(`./_ASSETS/${meta.id}.swf`, swfBuffer);
						} catch (compileErr) {
							console.error("font swf compilation failed:", compileErr);
							res.end(JSON.stringify({
								status: "error",
								suc: false,
								msg: "Font compilation failed: " + compileErr.message
							}));
							return;
						}
						break;
					}
				}
				fs.unlinkSync(path);
				if (f.type != "watermark") {
					if (!f.redirect) res.end(JSON.stringify({status: "ok", data: meta}));
					else {
						res.statusCode = 302;
						res.setHeader("Location", "/");
						res.end();
					}
				}
			});
			return true;
		} case "/ajax/getAssetFontStatus": {
			async function YugandarCantCodeShit() {
				const zip = nodezip.unzip(fs.readFileSync(`./_ASSETS/${url.query.assetId}`));
				const bareId = url.query.assetId.split(".zip")[0];
				let thumbnail;
				for (const filename in zip) {
					const buffer = await stream2buffer(zip[filename].toReadStream());
					if (filename.endsWith(".swf")) {
						// The compiled/playable font SWF. Written flat to ./_ASSETS/<id>.swf
						// on disk - served back out over HTTP via /assets/<id>.swf (thumb.js),
						// which is the URL FontModel.fontPathURI actually needs to be.
						fs.writeFileSync(`./_ASSETS/${bareId}.swf`, buffer);
					} else if (filename.endsWith("flag.png")) {
						// Thumbnail. Every other asset type (see database.json: char, bg,
						// video prop, etc.) stores its thumbnail flat as exactly "<id>.png"
						// directly in the asset folder - no subfolder, no filename suffix.
						// thumb.js's /assets/ handler only ever reads the last URL path
						// segment straight out of ./_ASSETS/, so anything nested or
						// suffixed is unreachable regardless of where it's written.
						fs.writeFileSync(`./_ASSETS/${bareId}.png`, buffer);
						thumbnail = `/assets/${bareId}.png`;
					} else if (filename.endsWith(".otf")) {
						fs.writeFileSync(`./_ASSETS/${bareId}.otf`, buffer);
					}
				}
				const db = DB.get();
				const info = db.assets.find(i => i.id == bareId);
				if (!info) {
					res.statusCode = 404;
					res.end(JSON.stringify({ suc: false, status: "error", msg: "asset record not found for " + bareId }));
					return;
				}
				info.trayImage = thumbnail
				DB.save(db);
				res.end(JSON.stringify({
					suc: true,
					status: "completed",
					asset_data: info
				}))
			}
			YugandarCantCodeShit();
			return true;
		} default: return;
	}
	function stream2buffer(r) {
		return new Promise((res, rej) => {
			const buffers = [];
			r.on("data", b => buffers.push(b)).on("end", () => res(Buffer.concat(buffers)));
		})
	}
}