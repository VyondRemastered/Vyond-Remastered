const database = require(`../wrapper/data/database`), DB = new database(true), db = DB.get();

if (db.rpc == "true") {
	const RPC = require("discord-rpc");
	const version = "2.5.0";

	const rpc = new RPC.Client({
		transport: "ipc"
	});
    const {
		DISCORD_CLIENT: clientId,
	} = process.env;
	const startTime = new Date();

	function setRPC(state) {
		rpc.setActivity({
			state,
			details: `Version ${version} Beta 3`,
			startTimestamp: startTime,
			largeImageKey: "favicon",
			largeImageText: "Vyond Remastered",
			smallImageKey: "Vyond Remastered",
			smallImagetext: "Vyond Remastered",
		});
	}

	module.exports = new Promise((res, rej) => {
		// set rpc activity when started
		rpc
			.on("ready", () => {
				setRPC("Idling");
				res(setRPC);
			})
			// connect rpc to app
			.login({ clientId })
			.catch((e) => {
				console.log("RPC connection failed.");
				res(() => true);
			});
	});
	return;
}
// set a blank function so we don't have to check if it's enabled
module.exports = new Promise((res) => res(() => true));