const formidable = require("formidable");
const header = process.env.XML_HEADER;
const fUtil = require("../fileUtil");
const nodezip = require("../zip/main");
const asset = require("./main");
const https = require("https");
const fs = require("fs");
const session = require("../data/sessions");

/* =========================
   XML SAFE BUILDER
========================= */

function createUGC() {
    const nodes = [];
    return {
        add(xml) {
            nodes.push(xml);
        },
        addMany(list) {
            for (const x of list) nodes.push(x);
        },
        build() {
            return `${header}<ugc more="0">${nodes.join("")}</ugc>`;
        }
    };
}

/* =========================
   HELPERS
========================= */

function getFontThumbFileName(id) {
    return fs
        .readdirSync(`./_ASSETS/img`)
        .find(file => file.endsWith(`_${id}.png`));
}

function charThemeFix(themeId) {
    switch (themeId) {
        case "custom": return "family";
        case "animal":
        case "action": return "cc2";
        default: return themeId;
    }
}

/* =========================
   MAIN LIST FUNCTION
========================= */

async function listAssets(f, data, makeZip, makeJson) {
    const ugc = createUGC();

    switch (data.type) {

        case "font": {
            return {
                status: "ok",
                result: asset.list("font").map(v => ({
                    id: v.id,
                    tags: v.tags,
                    published: v.published,
                    title: v.title,
                    enc_asset_id: v.enc_asset_id,
                    trayImage: `/assets/${v.id.split(".zip")[0]}/img/${getFontThumbFileName(v.id.split(".zip")[0])}`
                }))
            };
        }

        case "char": {
            const themeId = charThemeFix(data.themeId);
            const files = asset.list("char", 0, themeId);

            ugc.addMany(files.map(v =>
                `<char id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" cc_theme_id="${v.themeId}" thumbnail_url="/assets/${v.id}.png" copyable="Y"><tags>${v.tags}</tags></char>`
            ));
            break;
        }

        case "bg": {
            const files = asset.list("bg");

            ugc.addMany(files.map(v =>
                `<background subtype="0" enc_asset_id="${v.id}" id="${v.file}" name="${v.title}" enable="Y" asset_url="/assets/${v.file}"/>`
            ));
            break;
        }

        case "sound": {
            const files = asset.list("sound");

            ugc.addMany(files.map(v =>
                `<sound subtype="${v.subtype}" id="${v.file}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" duration="${v.duration}" downloadtype="progressive"/>`
            ));
            break;
        }

        case "movie": {
            const files = asset.list("movie");

            ugc.addMany(files.map(v =>
                `<movie id="${v.id}" enc_asset_id="${v.id}" path="/_SAVED/${v.id}" numScene="1" title="${v.title}" thumbnail_url="/assets/${v.id}.png"><tags>${v.tags}</tags></movie>`
            ));
            break;
        }

        case "prop": {
            const files = asset.list("prop");

            ugc.addMany(files.map(v =>
                v.file.endsWith(".flv")
                    ? `<prop subtype="video" enc_asset_id="${v.id}" id="${v.file}" name="${v.title}" enable="Y" holdable="0" headable="0" placeable="1" facing="left" width="${v.width}" height="${v.height}" asset_url="/assets/${v.file}" thumbnail_url="/assets/${v.id.slice(0, -3) + "png"}"/>`
                    : `<prop subtype="0" enc_asset_id="${v.id}" id="${v.file}" name="${v.title}" enable="Y" holdable="0" headable="0" placeable="1" facing="left" width="0" height="0" asset_url="/assets/${v.file}"/>`
            ));
            break;
        }
    }

    return formatOutput(ugc.build(), makeZip, makeJson);
}

/* =========================
   OUTPUT FORMATTER
========================= */

function formatOutput(xml, makeZip, makeJson) {
    if (makeZip) {
        const zip = nodezip.create();
        fUtil.addToZip(zip, "desc.xml", Buffer.from(xml));
        return zip.zip();
    }

    if (makeJson) {
        return {
            status: "ok",
            data: { xml }
        };
    }

    return xml;
}

/* =========================
   ROUTER
========================= */

module.exports = function (req, res, url) {
    let makeZip = false, makeJson = false, useDiscord = false;

    switch (url.pathname) {
    case "/goapi/getUserAssets/":
        makeZip = true;
        break;

    case "/api_v2/assets/imported":
        makeJson = true;
        break;
    case "/goapi/getUserAssetsXml/": break;
    default:
        return;
}

    if (req.method === "GET") {
        const q = url.query;
        if (!q.type) return;

        listAssets(session.get(req), q, makeZip, makeJson, useDiscord)
			.then(out => {
				res.setHeader("Content-Type",
					makeZip ? "application/zip"
					: makeJson ? "application/json"
					: "application/xml"
				);

				res.end(makeJson ? JSON.stringify(out) : out);
			})
			.catch(err => {
				console.error("listAssets failed:", err);
				res.statusCode = 500;
				res.end("Internal Server Error");
			});

        return true;
    }

    if (req.method === "POST") {
        new formidable.IncomingForm().parse(req, async (e, f) => {

            const out = await listAssets(session.get(req), f.data || f, makeZip, makeJson, useDiscord);

            res.setHeader("Content-Type",
                makeZip ? "application/zip"
                : makeJson ? "application/json"
                : "application/xml"
            );

            res.end(makeJson ? JSON.stringify(out) : out);
        });

        return true;
    }
};