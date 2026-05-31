const themeFolder = process.env.THEME_FOLDER;
const path = require("path");
const char = require('../character/main');
const source = path.join(__dirname, "../../server", process.env.CLIENT_URL);
const header = process.env.XML_HEADER;
const fUtil = require('../fileUtil');
const nodezip = require('../zip/main');
const store = path.join(__dirname, "../../server", process.env.STORE_URL);
const xmldoc = require('xmldoc');
const fs = require('fs');
const asset = require('../asset/main');
const database = require("../data/database"), DB = new database();

function name2Font(font) {
	switch (font) {
		case "Blambot Casual":
			return "FontFileCasual";
		case "BadaBoom BB":
			return "FontFileBoom";
		case "Entrails BB":
			return "FontFileEntrails";
		case "Tokyo Robot Intl BB":
			return "FontFileTokyo";
		case "Accidental Presidency":
			return "FontFileAccidental";
		case "BodoniXT":
			return "FontFileBodoniXT";
		case "Budmo Jiggler":
			return "FontFileBJiggler";
		case "Budmo Jigglish":
			return "FontFileBJigglish";
		case "Existence Light":
			return "FontFileExistence";
		case "HeartlandRegular":
			return "FontFileHeartland";
		case "Honey Script":
			return "FontFileHoney";
		case "I hate Comic Sans":
			return "FontFileIHate";
		case "Impact Label":
			return "FontFileImpactLabel";
		case "loco tv":
			return "FontFileLocotv";
		case "Mail Ray Stuff":
			return "FontFileMailRay";
		case "Mia\'s Scribblings ~":
			return "FontFileMia";
		case "Shanghai":
			return "FontFileShanghai";
		case "Comic Book":
			return "FontFileComicBook";
		case "Wood Stamp":
			return "FontFileWoodStamp";
		case "Brawler":
			return "FontFileBrawler";
		case "Coming Soon":
			return "FontFileCSoon";
		case "Glegoo":
			return "FontFileGlegoo";
		case "Lilita One":
			return "FontFileLOne";
		case "Telex Regular":
			return "FontFileTelex";
		case "Claire Hand":
			return "FontFileClaireHand";
		case "Oswald":
			return "FontFileOswald";
		case "Poiret One":
			return "FontFilePoiretOne";
		case "Raleway":
			return "FontFileRaleway";
		case "Bangers":
			return "FontFileBangers";
		case "Creepster":
			return "FontFileCreepster";
		case "BlackoutMidnight":
			return "FontFileBlackoutMidnight";
		case "BlackoutSunrise":
			return "FontFileBlackoutSunrise";
		case "Junction":
			return "FontFileJunction";
		case "LeagueGothic":
			return "FontFileLeagueGothic";
		case "LeagueSpartan":
			return "FontFileLeagueSpartan";
		case "OstrichSansMedium":
			return "FontFileOstrichSansMedium";
		case "Prociono":
			return "FontFileProciono";
		case "Lato":
			return "FontFileLato";
		case "Alegreya Sans SC":
			return "FontFileAlegreyaSansSC";
		case "Barrio":
			return "FontFileBarrio";
		case "Bungee Inline":
			return "FontFileBungeeInline";
		case "Bungee Shade":
			return "FontFileBungeeShade";
		case "Gochi Hand":
			return "FontFileGochiHand";
		case "IM Fell English SC":
			return "FontFileIMFellEnglishSC";
		case "Josefin":
			return "FontFileJosefin";
		case "Kaushan":
			return "FontFileKaushan";
		case "Lobster":
			return "FontFileLobster";
		case "Montserrat":
			return "FontFileMontserrat";
		case "Mouse Memoirs":
			return "FontFileMouseMemoirs";
		case "Patrick Hand":
			return "FontFilePatrickHand";
		case "Permanent Marker":
			return "FontFilePermanentMarker";
		case "Satisfy":
			return "FontFileSatisfy";
		case "Sriracha":
			return "FontFileSriracha";
		case "Teko":
			return "FontFileTeko";
		case "Vidaloka":
			return "FontFileVidaloka";
		case '':
		case null:
			return '';
		default:
			return `FontFile${font}`;
	}
}

function meta2Xml(v) {
	var response;
	switch (v.type) {
		case "char": {
			response = `<char id="${v.id}" enc_asset_id="${v.id}" name="Untitled" cc_theme_id="${v.themeId}" thumbnail_url="char_default.png" copyable="Y"><tags>${v.tags}</tags></char>`;
			break;
		}
		case "bg": {
			response = `<background subtype="0" id="${v.file}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" asset_url="/assets/${v.file}"/>`
			break;
		}
		case "movie": {
			response = `<movie id="${v.id}" enc_asset_id="${v.id}" path="/_SAVED/${v.id}" numScene="1" title="${v.name}" thumbnail_url="/assets/${v.id}.png"><tags></tags></movie>`;
			break;
		}
		case "prop": {
			if (v.subtype == "video") {
				response = `<prop subtype="video" id="${v.file}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" holdable="0" headable="0" placeable="1" facing="left" width="0" height="0" asset_url="/assets/${v.file}"/>`;
			} else {
				response = `<prop subtype="0" id="${v.file}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" holdable="0" headable="0" placeable="1" facing="left" width="0" height="0" asset_url="/assets/${v.file}"/>`;
			}
			break;
		}
		case "sound": {
			response = `<sound subtype="${v.subtype}" id="${v.file}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" duration="${v.duration}" downloadtype="progressive"/>`;
			break;
		}
	};
	return response;
}

module.exports = {
	xml2caché(buffer) {
		const xml = new xmldoc.XmlDocument(buffer);
		const cachéRef = {}, elements = xml.children;
		for (const eK in elements) {
			var element = elements[eK];
			if (element.name == 'asset')
				cachéRef[element.attr.id] =
					Buffer.from(element.val, 'base64');
		}
		return cachéRef;
	},
	/**
	 * 
	 * @param {Buffer} xmlBuffer 
	 * @param {string} mId
	 * @returns {Promise<Buffer>}
	 */
	async packXml(xmlBuffer) {
		if (xmlBuffer.length == 0) throw null;

		const zip = nodezip.create();
		const themes = { common: true }, assetTypes = {};
		var ugcString = `${header}<theme id="ugc" name="ugc">`;
		fUtil.addToZip(zip, 'movie.xml', xmlBuffer);
		const xml = new xmldoc.XmlDocument(xmlBuffer);
		const elements = xml.children;
		for (const eK in elements) {
			var element = elements[eK];
			switch (element.name) {
				case 'sound': {
					const val = element.childNamed('sfile').val;

					var pieces = val.split(".");
					if (val.endsWith('.swf')) {
						const pieces = val.split('.');
						const theme = pieces[0], name = pieces[1];
						const url = `${store}/${theme}/sound/${name}.swf`;
						const fileName = `${theme}.sound.${name}.swf`;
						const buffer = fs.readFileSync(url);
						fUtil.addToZip(zip, fileName, buffer);
					}
					else if (val.startsWith('ugc.')) {
						var ext = pieces.pop();
						pieces.splice(1, 0, element.name)

						var fileName = pieces.join(".") + `.${ext}`;
						if (!zip[fileName]) {
							var buff = asset.load(pieces[2]);
							var meta = asset.meta(pieces[2]);
							fUtil.addToZip(zip, fileName, buff);
							ugcString += meta2Xml(meta.data);
							themes[pieces[0]] = true;
						}
					}
					break;
				}

				case "scene": {
					for (var pK in element.children) {
						var piece = element.children[pK];
						var tag = piece.name;
						if (tag == "effectAsset") {
							tag = "effect";
						}

						switch (tag) {
							case "durationSetting":
							case "trans":
								break;
							case "bg":
							case "effect":
							case "prop": {
								var file = piece.childNamed("file");
								if (!file) continue;
								var val = file.val;
								var pieces = val.split(".");

								if (pieces[0] == "ugc") {
									var ext = pieces.pop();
									pieces.splice(1, 0, tag)

									var fileName = pieces.join(".") + `.${ext}`;
									if (!zip[fileName]) {
										var buff = asset.load(pieces[2]);
										var meta = asset.meta(pieces[2]);
										fUtil.addToZip(zip, fileName, buff);
										ugcString += meta2Xml(meta.data);
										themes[pieces[0]] = true;
									}
								} else {
									var ext = pieces.pop();
									pieces.splice(1, 0, tag);
									pieces[pieces.length - 1] += `.${ext}`;

									var fileName = pieces.join(".");
									if (!zip[fileName]) {
										var buff = fs.readFileSync(`${store}/${pieces.join("/")}`);
										fUtil.addToZip(zip, fileName, buff);
										themes[pieces[0]] = true;
									}
								}
								break;
							}
							case 'char': {
								const val = piece.childNamed('action').val;
								const pieces = val.split('.');

								let theme, fileName, buffer;
								switch (pieces[pieces.length - 1]) {
									case 'xml': {
										theme = pieces[0];
										const id = pieces[1];

										try {
											buffer = await char.load(id);
											const charTheme = await char.getTheme(id);
											fileName = `${theme}.char.${id}.xml`;
											if (theme == 'ugc')
												ugcString += `<char id="${id}"cc_theme_id="${charTheme}"><tags/></char>`;
										} catch (e) {
											console.log(e);
										}
										break;
									}
									case 'swf': {
										theme = pieces[0];
										const char = pieces[1];
										const model = pieces[2];
										const url = `${store}/${theme}/char/${char}/${model}.swf`;
										fileName = `${theme}.char.${char}.${model}.swf`;
										buffer = fs.readFileSync(url);
										break;
									}
								}

								for (const ptK in piece.children) {
									const part = piece.children[ptK];
									if (!part.children) continue;

									var urlF, fileF;
									switch (part.name) {
										case 'head':
											urlF = 'char';
											fileF = 'prop';
											break;
										case 'prop':
											urlF = 'prop';
											fileF = 'prop';
											break;
										default:
											continue;
									}

									const file = part.childNamed('file');
									const slicesP = file.val.split('.'); // we won't need to show the current emotion.
									if (slicesP.includes("ugc")) continue;
									slicesP.pop(), slicesP.splice(1, 0, urlF);
									const urlP = `${store}/${slicesP.join('/')}.swf`;

									slicesP.splice(1, 1, fileF);
									const fileP = `${slicesP.join('.')}.swf`;
									fUtil.addToZip(zip, fileP, fs.readFileSync(urlP));
								}

								if (buffer) {
									themes[theme] = true;
									fUtil.addToZip(zip, fileName, buffer);
								}
								break;
							}
							case 'bubbleAsset': {
								const bubble = piece.childNamed('bubble');
								const text = bubble.childNamed('text');
								if (text.attr.font == "Arial") continue;
								const font = `${name2Font(text.attr.font)}.swf`;
								const fontSrc = `${source}/go/font/${font}`;
								fUtil.addToZip(zip, font, fs.readFileSync(fontSrc));
								break;
							}
						}
					}
					break;
				}
			}
		}

		if (themes.family) {
			delete themes.family;
			themes.custom = true;
		}

		if (themes.cc2) {
			delete themes.cc2;
			themes.action = true;
		}

		const themeKs = Object.keys(themes);
		themeKs.forEach(t => {
			if (t == 'ugc') return;
			const file = fs.readFileSync(`${themeFolder}/${t}.xml`);
			fUtil.addToZip(zip, `${t}.xml`, file);
		});

		fUtil.addToZip(zip, 'themelist.xml', Buffer.from(`${header}<themes>${
			themeKs.map(t => `<theme>${t}</theme>`).join('')}</themes>`));
		fUtil.addToZip(zip, 'ugc.xml', Buffer.from(ugcString + `</theme>`));
		return await zip.zip();
	},
	getTTSIds(xmlBuffer) { // deletes a tts asset to save user storage
		const ids = [];
		const xml = new xmldoc.XmlDocument(xmlBuffer);
		const elements = xml.children;
		for (const eI in elements) {
			const element = elements[eI];
			switch (element.name) {
				case 'sound': {
					const val = element.childNamed('sfile').val;
					const pieces = val.split(".");
					if (val.startsWith('ugc.')) {
						pieces.splice(1, 0, element.name)
						const meta = asset.meta(pieces[2]);
						if (meta.data.subtype == "tts") {
							if (!fs.existsSync(`./_ASSETS/${meta.data.id}.${meta.data.ext}`)) {
								const db = DB.get();
								if (db.assets.find(i => i.id == meta.data.id)) { // deletes the info from the db if it still exists.
									const index = db.assets.findIndex(i => i.id == meta.data.id);
									db.assets.splice(index, 1);
									DB.save(db);
								}
							} else ids.push(meta.data.id);
						}
					}
				}
				break;
			}
		}
		return ids;
	},
	/**
	 * 
	 * @param {{[aId:string]:Buffer}} buffers
	 * @param {Buffer} thumb
	 * @param {string} movieId
	 * @returns {Promise<Buffer>}
	 */
	async unpackZip(zip, thumb = null, movieId) {
		return new Promise(res => {

			const pieces = [];
			const stream = zip['movie.xml'].toReadStream();
			stream.on('data', b => pieces.push(b));
			stream.on('end', async () => {
				const time = new Date() - 0;
				const main = Buffer.concat(pieces).slice(0, -7);
				const xmlBuffers = [], assetHash = {};
				const charMap = {}, charBuffers = {};
				for (let c = 0, end; ; c = main.indexOf('ugc.', c) + 4) {

					if (c == 0) continue; else if (c == 3) {
						xmlBuffers.push(main.subarray(end));
						break;
					}

					xmlBuffers.push(main.subarray(end, c));
					const assetId = main.subarray(c, end =
						main.indexOf('<', c + 1)).toString();
					const index = assetId.indexOf('-');
					const prefix = assetId.substr(0, index);
					switch (prefix) {
						case 'c':
						case 'C': {
							const dot = assetId.indexOf('.');
							const charId = assetId.substr(0, dot);
							const saveId = charMap[charId] =
								charMap[charId] || `C-${c}-${time}`;
							const remainder = assetId.substr(dot);
							xmlBuffers.push(Buffer.from(saveId + remainder));
							try {
								charBuffers[saveId] = await char.load(charId);
							} catch (e) { };
							break;
						}
						default: {
							xmlBuffers.push(Buffer.from(assetId));
							assetHash[assetId] = true;
						}
					}
				}

				for (const id in charBuffers) {
					const buff = charBuffers[id];
					var start = header.length + 9;;
					if (buff.includes('file_name'))
						start = buff.indexOf('.xml', start) + 6;
					const element = buff.subarray(start);
					xmlBuffers.push(Buffer.from(`<cc_char file_name='ugc.char.${id}.xml' ${element}`));
				}

				if (thumb) {
					const thumbString = thumb.toString('base64');
					xmlBuffers.push(Buffer.from(`<thumb>${thumbString}</thumb>`));
				}

				xmlBuffers.push(Buffer.from(`</film>`));
				res(Buffer.concat(xmlBuffers));
			});
		});
	},
	/**
	 * 
	 * @param {Buffer} xml 
	 * @param {number} id 
	 */
	async unpackXml(xml, id) {
		const beg = xml.lastIndexOf('<thumb>');
		const end = xml.lastIndexOf('</thumb>');
		if (beg > -1 && end > -1) {
			const sub = Buffer.from(xml.subarray(beg + 7, end).toString(), 'base64');
			fs.writeFileSync(fUtil.getFileIndex('thumb-', '.png', id), sub);
		}
		fs.writeFileSync(fUtil.getFileIndex('movie-', '.xml', id), xml);
	},
	async unpackCharXml(xml, id) {
		fs.writeFileSync(fUtil.getFileIndex('char-', '.xml', id), xml);
	},
}