/**
 * Vyond: Remastered
 * License: MIT
 */

const { app, BrowserWindow, Menu } = require("electron");
const fs = require("fs");
if (!fs.existsSync("./config.json")) {
    console.log("Config does not exist. Creating...");
    const config = {
        SWF_URL: "/animation/414827163ad4eb60",
        STORE_URL: "/store/3a981f5cb2739137",
        CLIENT_URL: "/static/ad44370a650793d9",
        lvmType: "go_full"
    };
    fs.writeFileSync("./config.json", JSON.stringify(config, null, "\t"));
}
if (!fs.existsSync("./wrapper/static/info.json")) {
	console.log("Info does not exist. Creating...");
	const info = {
		GET: {
			"/index.html": {
				headers: {
					Location: "/pages/html/list.html"
				},
				statusCode: 302,
				content: ""
			},
			"/$": {
				headers: {
					Location: "/pages/html/list.html"
				},
				statusCode: 302,
				content: ""
			},
			"/dashboard/videos": {
				headers: {
					Location: "/pages/html/list.html"
				},
				statusCode: 302,
				content: ""
			},
			"/goapi/getAssetTags": {
				headers: {
					"Content-Type": "application/json"
				},
				content: []
			},
			"/account/logo": {
				headers: {
					Location: "/pages/html/settings.html"
				},
				statusCode: 302,
				content: ""
			},
			"/crossdomain.xml": {
				headers: {
					"Content-Type": "text/html; charset=UTF-8"
				},
				content: '<cross-domain-policy><allow-access-from domain="*"/></cross-domain-policy>'
			},
			"cc.swf": {},
			"go_full.swf": {},
			"favicon.ico": {},
			"char_default.png": {
				content: ""
			},
			"char-default.png": {
				content: ""
			},
			"pages/html/(.*)": {
				headers: {
					"Content-Type": "text/html; charset=UTF-8"
				}
			},
			"pages/css/(.*)": {
				headers: {
					"Content-Type": "text/css; charset=UTF-8"
				}
			},
			"pages/fonts/(.*)": {
				headers: {
					"Content-Type": "application/font-woff; charset=UTF-8"
				}
			},
			"pages/img/(.*)(png|PNG)$": {
				headers: {
					"Content-Type": "image/png"
				}
			},
			"pages/img/(.*)(jpg|JPG|jpeg|JPEG)$": {
				headers: {
					"Content-Type": "image/jpeg"
				}
			},
			"pages/img/(.*)(svg|SVG)$": {
				headers: {
					"Content-Type": "image/svg+xml; charset=UTF-8"
				}
			},
			"pages/js/(.*)": {
				headers: {
					"Content-Type": "text/javascript; charset=UTF-8"
				}
			},
			"/html/([^?]+html).*": {
				contentReplace: true,
				regexLink: "/html/$1",
				headers: {
					"Content-Type": "text/html; charset=UTF-8"
				}
			},
			"/html/([^?]+).*": {
				regexLink: "/html/$1",
				headers: {
					"Content-Type": "text/html; charset=UTF-8"
				}
			}
		},
		POST: {
			"/ajax/goVideoList/": {
				headers: {
					Location: "/"
				},
				statusCode: 302,
				content: ""
			},
			"/goapi/getUserFontList/": {
				headers: {
					"Content-Type": "application/json"
				},
				content: {
					status: "ok"
				}
			},
			"/api_v2/team/members": {
				headers: {
					"Content-Type": "application/json"
				},
				content: {
					status: "ok",
					data: []
				}
			},
			"/api_v2/studio_preference/get": {
				headers: {
					"Content-Type": "application/json"
				},
				content: {
					status: "ok",
					data: []
				}
			},
			"/api_v2/text_component/get_list": {
				headers: {
					"Content-Type": "application/json"
				},
				content: {
					status: "ok",
					data: []
				}
			},
			"/api_v2/text_component/add": {
				headers: {
					"Content-Type": "application/json"
				},
				content: {
					status: "ok",
					data: {}
				}
			},
			"/goapi/getLatestAssetId/": {
				headers: {
					"Content-Type": "text/html; charset=UTF-8"
				},
				content: '0'
			}
		},
		pages: {
			"/cc": "<script>function characterSaved(){window.location='/'}</script>"
		}
	};
	fs.writeFileSync("./wrapper/static/info.json", JSON.stringify(info, null, "\t"));
}
const env = Object.assign(process.env, require("./env"), require("./config"));
const config = JSON.parse(fs.readFileSync("./config.json"));
const path = require("path");
const dirs = [env.SAVED_FOLDER, env.CACHÉ_FOLDER, env.ASSET_FOLDER, env.WATERMARKS_FOLDER];
for (const dir of dirs) if (!fs.existsSync(dir)) fs.mkdirSync(dir);

// start the server
require("./wrapper/server");

if (process.env.OS_USED != "Windows" && env.Opperating_System == "Linux" && process.platform == "linux") { // only load flash when the user has linux on their computer.
	/**
	 * load flash player
	 */
	app.commandLine.appendSwitch("no-sandbox");
	app.commandLine.appendSwitch("ppapi-flash-path", path.join(__dirname, "./extensions/libpepflashplayer.so"));
	app.commandLine.appendSwitch("ppapi-flash-version", "32.0.0.371");

	let mainWindow;
	const createWindow = () => {
		mainWindow = new BrowserWindow({
			width: 1200,
			height: 700,
			title: "Vyond Remastered",
			icon: path.join(__dirname, "./wrapper/favicon.ico"),
			webPreferences: {
				plugins: true,
				contextIsolation: true
			}
		});
		// use it in external scripts
		config.session = { browserWindowId: mainWindow.id };
        fs.writeFileSync("./config.json", JSON.stringify(config))

		// initialize stuff
		Menu.setApplicationMenu(Menu.buildFromTemplate([]));
		// load the video list
		mainWindow.loadURL("http://localhost:4343");
		mainWindow.on("closed", () => mainWindow = null);

		// debug stuff
		mainWindow.webContents.openDevTools();
	};
	app.whenReady().then(() => {
		// wait for the server
		setTimeout(createWindow, 2000);
	});
    app.on("window-all-closed", () => app.quit()).on("activate", () => {
		if (mainWindow === null) createWindow();
	})
}
