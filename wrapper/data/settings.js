const database = require("./database"), DB = new database(true);
const formidable = require("formidable");
const exec = require('child_process').execFile;
const fs = require("fs");
const path = require("path");
let discord;
require(`../../utils/discord`).then(f => discord = f);

/**
 * Function to execute exe
 * @param {string} fileName The name of the executable file to run.
 * @param {string} path Current working directory of the child process.
 */
function execute(fileName, params, path) {
    return new Promise((resolve, reject) => {
        exec(fileName, params, { cwd: path }, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });

    });
}

module.exports = function (req, res, url) {
    if (req.method != "POST") return;
    switch (url.path) {
        case "/api/settings/update": { // updates settings
            new formidable.IncomingForm().parse(req, async (e, f, files) => {
                try {
                    const db = DB.get();
                    if (f.changeStudioType) {
                        if (f.filename) db.studio.filename = f.filename;
                        else db.studio.tutorial = f.tutorial;
                    }
                    else db[f.type] = f.value;
                    DB.save(db);
                    res.end(JSON.stringify({status: "ok"}));
                } catch (e) {
                    console.log(e);
                    res.end(JSON.stringify({status: "error", msg: e}));
                }
            });
            break;
        } case "/api/settings/cmd/open": { // uses the launchSettings.exe file to open settings.bat. (Only works on windows right now)
            if (process.env.OS_USED == "Windows") execute("launchSettings.exe", [], path.join(__dirname, "../../")), res.end();
            break;
        } case "/api/config/get": {
            res.end(JSON.stringify(JSON.parse(fs.readFileSync("./config.json"))));
            break;
        } case "/api/config/save": {
            new formidable.IncomingForm().parse(req, async (e, f, files) => {
                const config = JSON.parse(fs.readFileSync("./config.json"));
                config[f.type] = f.value;
                fs.writeFileSync("./config.json", JSON.stringify(config, null, "\t"));
                res.end();
            })
            break;
        } case "/api/setDiscordStatus": {
            new formidable.IncomingForm().parse(req, async (e, f, files) => discord(f.status));
            break;
        }
        default: return;
    }
    return true;
};
