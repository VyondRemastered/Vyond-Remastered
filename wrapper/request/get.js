const https = require("https");
const http = require("http");

/**
 * @param {string} url
 * @param {Object} options
 * @returns {Promise<Buffer>}
 */
module.exports = function get(url, options = {}) {
	const data = [];

	return new Promise((res, rej) => {
		try {
			https.get(url, options, r => {
				r.on("data", v => data.push(v));
				r.on("end", () => res(Buffer.concat(data)));
				r.on("error", rej);
			});
		} catch {
			http.get(url, options, r => {
				r.on("data", v => data.push(v));
				r.on("end", () => res(Buffer.concat(data)));
				r.on("error", rej);
			});
		}
	});
};
