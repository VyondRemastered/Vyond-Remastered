/***
 Just a simple script for rendering those lovely "Aa" font thumbnails.
 */
const opentype = require("opentype.js");
const sharp = require("sharp");
const fs = require("fs");

const [, , fontPath, outPath, sampleText] = process.argv;
const text = sampleText || "Aa";

(async () => {
	try {
		const buffer = fs.readFileSync(fontPath);
		const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
		const font = opentype.parse(arrayBuffer);

		const canvasWidth = 300;
		const canvasHeight = 150;
		const fontSize = 90;

		const measurePath = font.getPath(text, 0, 0, fontSize);
		const bbox = measurePath.getBoundingBox();
		const textWidth = bbox.x2 - bbox.x1;
		const textHeight = bbox.y2 - bbox.y1;

		const x = (canvasWidth - textWidth) / 2 - bbox.x1;
		const y = (canvasHeight - textHeight) / 2 - bbox.y1;

		const pathData = font.getPath(text, x, y, fontSize).toPathData(2);

		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
			<rect width="100%" height="100%" fill="#ffffff"/>
			<path d="${pathData}" fill="#1a1a1a"/>
		</svg>`;

		await sharp(Buffer.from(svg)).png().toFile(outPath);
		process.exit(0);
	} catch (err) {
		console.error(err && err.message ? err.message : err);
		process.exit(1);
	}
})();
