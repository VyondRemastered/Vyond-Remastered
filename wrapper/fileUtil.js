const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const mp3Duration = require("mp3-duration");
const nodezip = require("./zip/main");

ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);

function padZero(num, width = 7) {
	num = num.toString();
	while (num.length < width) {
		num = "0" + num;
	}
	return num;
}

function generateId() {
	return Math.random().toString(16).substring(2, 9);
}

function streamToBuffer(stream) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		stream.on("data", chunk => chunks.push(chunk));
		stream.on("end", () => resolve(Buffer.concat(chunks)));
		stream.on("error", reject);
	});
}

function convertToMp3(data, fileExt) {
	return new Promise((res, rej) => {
		const command = ffmpeg(data)
			.inputFormat(fileExt)
			.toFormat("mp3")
			.audioBitrate(44000)
			.on("error", rej);

		res(command.pipe());
	});
}

function addToZip(zip, zipName, buffer) {
	zip.add(zipName, buffer);
	if (zip[zipName] && zip[zipName].crc32 < 0) {
		zip[zipName].crc32 += 4294967296;
	}
}

function zippy(fileName, zipName) {
	if (!fs.existsSync(fileName)) {
		return Promise.reject(new Error("File does not exist"));
	}

	const buffer = fs.readFileSync(fileName);
	const zip = nodezip.create();
	addToZip(zip, zipName, buffer);
	return zip.zip();
}

module.exports = {
	generateId,
	convertToMp3,
	zippy,
	addToZip,
	padZero,
};
