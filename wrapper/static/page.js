const fUtil = require("../fileUtil");
const eta = require("eta");
const fs = require("fs");
let discord;
require(`../../utils/discord`).then(f => discord = f);
const session = require("../data/sessions");
function toAttrString(table) {
	return typeof (table) == 'object' ? new URLSearchParams(table).toString() : table.replace(/"/g, "\\\"");
}
function toParamString(table) {
	return Object.keys(table).map(key =>
		`<param name="${key}" value="${toAttrString(table[key])}">`
	).join(' ');
}
function toObjectString(attrs, params) {
	return `<object id="obj" ${Object.keys(attrs).map(key =>
		`${key}="${attrs[key].replace(/"/g, "\\\"")}"`
	).join(' ')}>${toParamString(params)}</object>`;
}
const database = require("../data/database"), DB = new database(true);

module.exports = function (req, res, url) {
	if (req.method != 'GET') return;
	const presave = !url.query.movieId ? fUtil.generateId() : url.query.movieId;
	const query = url.query;
	const config = JSON.parse(fs.readFileSync("./config.json"));
	const db = DB.get();
	// parse urls for the lvm
	const SWF_URL = process.env.SWF_URL.replace("127.0.0.1", "localhost");
	const STORE_URL = process.env.STORE_URL.replace("127.0.0.1", "localhost");
	const CLIENT_URL = process.env.CLIENT_URL.replace("127.0.0.1", "localhost");
	var attrs, params, title, filename;
	switch (url.pathname) {
		case "/cc": {
			discord("Creating a character");
			title = "Character Creator";
			filename = "char";
			attrs = {
				data: SWF_URL + "/cc.swf", // data: "cc.swf",
				type: "application/x-shockwave-flash", 
				id: "char_creator", 
				width: "960", 
				height: "600", 
				style:"display:block;margin-left:auto;margin-right:auto;",
			};
			params = {
				flashvars: {
					"original_asset_id": query["id"] || "",
					"themeId": "family",
					"ut": 60,
					"bs": "adam",
					"appCode": "go",
					"page": "",
					"siteId": "go",
					"m_mode": "school",
					"isLogin": "Y",
					"isEmbed": 1,
					"ctc": "go",
					"tlang": "en_US",
					"apiserver": "/",
					"storePath": STORE_URL + "/<store>",
					"clientThemePath": CLIENT_URL + "/<client_theme>"
				},
				allowScriptAccess: "always",
				movie: SWF_URL + "/cc.swf", // "http://localhost/cc.swf"
			};
			break;
		}
		
		case "/cc_browser": {
			discord("Browsing some characters");
			title = "CC Browser";
			filename = "char";
			attrs = {
				data: SWF_URL + "/cc_browser.swf", // data: 'cc_browser.swf',
				type: "application/x-shockwave-flash",
				id: "char_creator",
				width: '100%', 
				height: '600', 
				style:'display:block;margin-left:auto;margin-right:auto;',
			};
			params = {
				flashvars: {
					apiserver: "/",
					storePath: STORE_URL + "/<store>",
					clientThemePath: CLIENT_URL + "/<client_theme>",
					original_asset_id: query["id"] || null,
					themeId: "family",
					ut: 60,
					appCode: "go",
					page: "",
					siteId: "go",
					m_mode: "school",
					isLogin: "Y",
					retut: 1,
					goteam_draft_only: 1,
					isEmbed: 1,
					ctc: "go",
					tlang: "en_US",
					lid: 13,
				},
				allowScriptAccess: "always",
				movie: SWF_URL + "/cc_browser.swf", // 'http://localhost/cc_browser.swf'
			};
			break;
		}

		case "/go_full": {
			discord("Creating a new video")
			title = "Video Editor";
			filename = db.studio.filename;
			let flashvars;
			attrs = {
				type: "application/x-shockwave-flash", width: "100%", height: "100%",
			};
			let newFlashvars = {
				isWixPaid: 1,
				appCode: "go",
				collab: 0,
				ctc: "go",
				goteam_draft_only: 1,
				isLogin: "Y",
				isWide: db.resolution || 1,
				isRetro: db.resolution || 2,
				lid: 0,
				presaveId: presave,
				nextUrl: "/ajax/goVideoList/",
				page: "",
				retut: 1,
				siteId: "11",
				tray: "custom",
				tlang: "en_US",
				ut: 60,
				apiserver: "/",
				clientThemePath: CLIENT_URL + "/<client_theme>",
			};
			let oldFlashvars = {
				presaveId: presave,
				loadas: 0,
				asId: "",
				originalId: "",
				apiserver: "/",
				clientThemePath: "/static/ad44370a650793d9/<client_theme>",
				userId: "2292",
				username: "good bois",
				uemail: "crazy suitcase",
				numContact: "0",
				ut: 60,
				ve: false,
				isEmbed: 0,
				nextUrl: "/ajax/goVideoList/",
				lid: 0,
				ctc: "go",
				themeColor: "black",
				tlang: "en_US",
				siteId: "11",
				templateshow: "false",
				forceshow: "false",
				appCode: "go",
				lang: "en",
				tmcc: "192",
				fb_app_url: "/",
				is_published: "1",
				is_private_shared: "0",
				upl: 1,
				hb: "1",
				pts: "0",
				msg_index: "",
				ad: 0,
				has_asset_bg: 0,
				has_asset_char: 0,
				initcb: "studioLoaded",
				retut: 0,
				s3base: "http://localhost:4343/",
				st: "",
				uisa: 0,
				u_info_school: "OjI6a2JxQzN0MFNSKzFTYW4wTENRc01PZ2N6TURkZ0J3OWFmTzRjeW9aS3l1ak04MCtnUE5CUFo3Y0hmT0JDZndlMDlCM1V0VVVfc05pTU41cGVHYXpKOXV4YVpPZG9icHNoMHNHZmtiWjMxRnpTYlFXNDdPNHk0PQ==",
				tm: "FIN",
				uplp: 0,
				isWide: db.resolution || 1,
				isRetro: db.resolution || 2
			};
			switch (filename) {
				case "studio": {
					flashvars = newFlashvars;
					break;
				} case "studio_legacy": {
					flashvars = oldFlashvars;
					break;
				}
			}
			switch (db.year) {
				case "late_2015":
				case "2015": {
					flashvars.storePath = "/store/50/<store>";
					attrs.data = flashvars.bgload = `/animation/a0ecfa2ef0a868c4/go_full_${db.year}.swf`;
					flashvars.animationPath = `/animation/a0ecfa2ef0a868c4/`
					break;
				} case "2016": {
					flashvars.storePath = "/store/3a981f5cb2739137/<store>";
					attrs.data = flashvars.bgload = SWF_URL + `/${config.lvmType}.swf`;
					flashvars.animationPath = `/animation/414827163ad4eb60/`
					break;
				} default: {
					flashvars.storePath = "/store/3a981f5cb2739137/<store>";
					attrs.data = flashvars.bgload = `/animation/66453a3ba2cc5e1b/go_full_${db.year}.swf`;
					flashvars.animationPath = `/animation/66453a3ba2cc5e1b/`
					break;
				}
			}
			params = {
				flashvars,
				allowScriptAccess: "always",
			};
			session.set(params, req);
			break;
		}

		case '/player': {
			discord("Watching a video");
			title = 'Video Player';
			filename = "player";
			attrs = {
				data: SWF_URL + '/player.swf',
				type: 'application/x-shockwave-flash', width: '100%', height: '100%',
			};
			params = {
				flashvars: {
					'apiserver': '/', 'storePath': STORE_URL + '/<store>', 'ut': 60,
					'autostart': 1, 'isRetro': db.resolution || 2, 'isWide': db.resolution || 1, 'clientThemePath': CLIENT_URL + '/<client_theme>',
				},
				allowScriptAccess: 'always',
				allowFullScreen: 'true',
			};
			break;
		}

		case "/error": {
			discord(`Got an error saying ${url.query.err}`);
			res.end(`<title>Error</title><a href="/">Home</a><center>${url.query.err}</center>`);
			break;
		}
		default:
			return;
	}
	if (url.pathname != "/error") {
		res.setHeader('Content-Type', 'text/html; charset=UTF-8');
		Object.assign(params.flashvars, query);
		const info = { 
			object: toObjectString(attrs, params), 
			title, 
			tutorial: query.tutorial ? false : true, 
			flashvars: JSON.stringify(params.flashvars), 
			objectString: new URLSearchParams(params.flashvars).toString(),
			tutorialScript: query.tutorial ? `
			var interactiveTutorial = { 
				needToShow: function() { 
					return true 
				} 
			};` : ''
		}
		info.data = attrs.data
		eta.renderFile(`${__dirname}/../views/${filename}`, info, (e, d) => res.end(d))
	}
	return true;
}