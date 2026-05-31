module.exports = function (req, res, url) {
	if (req.method != "GET" || !req.url.startsWith("/videomaker/full")) return;
	const tId = req.url.split("/")[3];
	res.statusCode = 302;
	res.setHeader("Location", `/go_full?${req.url.includes("tutorial") ? `tutorial=0&tray=${tId}` : `tray=${tId}`}`);
	res.end();
	return true;
}