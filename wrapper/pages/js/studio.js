const importer = $("#importer");
const previewer = $("#previewer");
const studio = $("#obj");
let importJson;

/**
 * studio functions
 */
var interactiveTutorial = { // hide interactive tutorial
	neverDisplay: function() {
		return tutorial;
	}
};
function studioLoaded(arg) { console.log(arg) }
function exitStudio() { window.location = "/" }
function quitStudio() { exitStudio() }

/**
 * show and hide widgets
 */
let importerVisible = false;
function showImporter() {
	switch(importerVisible) {
		case true: {
			hideImporter();
			break;
		}
		case false:
		default: {
			importerVisible = true;
			importer.css("width", "400px");
			if (!importer.data("importer")) importer.data("importer", new AssetImporter(importer))
		}
	}
	return true;
}
function hideImporter() {
	importerVisible = false;
	importer.css("width", "");
}
function initPreviewPlayer(dataXmlStr, startFrame) {
	movieDataXmlStr = dataXmlStr;
	filmXmlStr = dataXmlStr.split("<filmxml>")[1].split("</filmxml>")[0];
	hideImporter(); // hide importer before previewing
	$("#preview_player").html(`<object data="/animation/414827163ad4eb60/player.swf" type="application/x-shockwave-flash" width="800" height="450" bgcolor="#000000">
	<param name="flashvars" value="apiserver=/&amp;isEmbed=1&amp;tlang=en_US&amp;isInitFromExternal=1&amp;startFrame=${startFrame}&amp;autostart=1&amp;storePath=/store/3a981f5cb2739137/&lt;store&gt;&amp;clientThemePath=/static/ad44370a650793d9/&lt;client_theme&gt;" />
	<param name="allowScriptAccess" value="always" />
	<param name="allowFullScreen" value="true" />
</object>`);
	previewer.css("display", "block");
	studio.css("height", "0");
}
function retrievePreviewPlayerData() { return movieDataXmlStr }
function hidePreviewer(savingVideo = false) {
	previewer.css("display", "none");
	studio.css("height", "");
	if (!savingVideo) studio[0].onExternalPreviewPlayerCancel();
}
function publishStudio() {
	hidePreviewer(true);
	studio[0].onExternalPreviewPlayerPublish();
}
function handleError(err) {
	console.error("Import failed.", err);
	studio[0].importerStatus("clear");
}

/**
 * importer
 */
class AssetImporter {
	constructor(importer) {
		this.importer = importer;
		this.queue = importer.find("#importer-queue");
		this.config = { maxsize: false }
		this.initialize();
	}
	initialize() {
		this.importer.find("#importer-files").on("change", event => {
			//uploads every file
			var fileUpload = document.getElementById("importer-files");
			for (var i = 0; i < fileUpload.files.length; i++) this.addFiles(fileUpload.files[i]);
		});
		this.importer.on("dragover", event => {
			event.preventDefault();
			event.stopPropagation();
		});
		this.importer.on("dragenter", event => {
			event.preventDefault();
			event.stopPropagation();
		})
		this.importer.on("drop", event => {
			event.preventDefault();
			event.stopPropagation();
			const files = event.originalEvent.dataTransfer.files;
			for (var i = 0; i < files.length; i++) {
				this.addFiles(files[i]);
			}
		})
	}
	addFiles(file) { //adds a file to the queue
		//image importing
		const ext = file.name.substring(file.name.lastIndexOf(".") + 1);
		const maxsize = this.config.maxsize
		if (maxsize && file.size > maxsize) return; // check if file is too large
		var validFileType = false;
		let el;
		switch (ext) {
			case "mp3":
			case "wav":
			case "ogg":
			case "flac": {
				validFileType = true;
				el = $(`
					<div class="importer_asset">
						<div class="asset_metadata">
							<img class="asset_preview" src="/pages/img/importer/sound.png" />
							<div>
								<h4>${file.name}</h4>
								<p class="asset_subtype">${filesize(file.size)} | Import as...</p>
							</div>
						</div>
						<div class="import_as">
							<a href="#" type="bgmusic">Music</a>
							<a href="#" type="soundeffect">Sound effect</a>
							<a href="#" type="voiceover">Voiceover</a>
							<a href="#" action="close">Close</a>
							<a href="#" action="goBack">Back</a>
						</div>
					</div>
				`).appendTo(this.queue);
				break;
			}
			case "ttf":
			case "otf": {
				validFileType = true;
				el = $(`
				<div class="importer_asset">
					<div class="asset_metadata">
						<img class="asset_preview" src="/pages/img/importer/font.png" />
						<div>
							<h4>${file.name}</h4>
							<p class="asset_subtype">${filesize(file.size)} | Import as...</p>
						</div>
					</div>
					<div class="import_as">
						<a href="#" type="font">Font</a>
						<a href="#" action="close">Close</a>
						<a href="#" action="goBack">Back</a>
					</div>
				</div>
					`).appendTo(this.queue);
				break;
			}
			case "gif":
			case "jfif":
			case "swf":
			case "jpg":
			case "webp":
			case "avif":
			case "png": {
				validFileType = true;
				el = $(`
					<div class="importer_asset">
						<div class="asset_metadata">
							<img class="asset_preview" src="/pages/img/importer/image.png" />
							<div>
								<h4>${file.name}</h4>
								<p class="asset_subtype">${filesize(file.size)} | Import as...</p>
							</div>
						</div>
						<div class="import_as">
							<a href="#" type="bg">Background</a>
							<a href="#" type="prop">Prop</a>
							<a href="#" action="close">Close</a>
							<a href="#" action="goBack">Back</a>
						</div>
					</div>
				`).appendTo(this.queue);
				break;
			} 
			case "webm":
			case "mp4": {
				validFileType = true;
				el = $(`
					<div class="importer_asset">
						<div class="asset_metadata">
							<img class="asset_preview" src="/pages/img/importer/video.png" />
							<div>
								<h4>${file.name}</h4>
								<p class="asset_subtype">${filesize(file.size)} | Video</p>
							</div>
						</div>
						<div class="import_as">
							<p>Video importing won't be added because most of you are used to including videos in your animation using a video editor. it's also because it tends to be dodgy according to David's Creation and it is very hard to work on. not sure how the devs in wrapper offline managed to pull off a stunt like that.</p>
							<a href="#" action="close">Close</a><a href="#" action="goBack">Back</a>
						</div>
					</div>
				`).appendTo(this.queue);
				break;
			}
		}
		if (!validFileType) {
			el = $(`
				<div class="importer_asset">
					<div class="asset_metadata">
						<div>
							<h4>${file.name}</h4>
							<p class="asset_subtype">Invaild File Type</p>
						</div>
					</div>
					<div class="import_as"><a href="#" action="close">Close</a><a href="#" action="goBack">Back</a></div>
				</div>
			`).appendTo(this.queue);
		}
		new ImporterFile(file, el, ext);
	}
}
class ImporterFile {
	constructor(file, element, ext) {
		this.file = file;
		this.el = element;
		this.ext = ext
		this.initialize();
	}
	initialize() {
		switch (this.ext) {
			case "webp":
			case "avif":
			case "jfif":
			case "jpg":
			case "png": { // load image preview
				const fr = new FileReader();
				fr.addEventListener("load", (e) => {
					this.el.find("img").attr("src", e.target.result)
				})
				fr.readAsDataURL(this.file)
			}
		}
		this.el.find("[type]").on("click", (event) => {
			const el = $(event.target);
			const type = el.attr("type");
			importJson = this.typeFickser(type);
			this.upload(this.file);
		});
		this.el.on("click", "[action]", event => {
			const el = $(event.target);
			const action = el.attr("action");

			switch (action) {
				case "openUserLibrary": {
					studio[0].openYourLibrary();
					break;
				} case "close": {
					this.el.fadeOut(() => this.el.remove());
					studio[0].importerStatus("clear");
					break;
				} case "goBack": {
					for (let i = 0; i < 2; i++) window.history.back();
					break;
				}
			}
		});
	}
	typeFickser(type) {
		switch (type) {
			case "bgmusic":
			case "soundeffect":
			case "voiceover": {
				return { type: "sound", subtype: type }
			}
			case "font": {
				return {type: "font", subtype: 0 }
			}
			case "bg":
			case "prop":  {
				return { type: type, subtype: 0 }
			}
		}
	}
	upload(file) { // adds a file to the queue
		studio[0].importerStatus("processing");
		var b = new FormData();
		b.append("import", file);
		b.append("type", importJson.type);
		b.append("subtype", importJson.subtype);
		$.ajax({
			url: "/api/asset/upload",
			method: "POST",
			data: b,
			processData: false,
			contentType: false,
			dataType: "json"
		}).done(d => {
			studio[0].importerStatus("done");
			studio[0].importerUploadComplete(importJson.type, d.data.file, d.data);
			this.el.find(".import_as").html(`<a href="#" action="openUserLibrary">Open Your Library</a><a href="#" action="close">Close</a><a href="#" action="goBack">Back</a>`);
		}).catch(handleError);
	}
}
/*
 * Video Tutorial
 */
class VideoTutorial {
    constructor(a) {
        this.$el = a;
        this.wistiaEmbed = null;
        this.initialize()
    }
    initialize() {
        var a = this;
        this.$el.find(".close-button, .tutorial-button").click(function(b) {
            b.preventDefault();
            a.hide()
        });
    }
    launch(a) {
        if (!VideoTutorial.tutorials[a]) return;
        var b = VideoTutorial.tutorials[a];
        this.show();
        this.$el.find("h2").text(b.title);
        this.wistiaEmbed = Wistia.embed(b.wistiaId, {
            autoPlay: true,
            container: "wistia_player"
        });
    }
    show() {
        this.$el.css("display", "block");
        studio.css("height", "0");
    }
    hide() {
        if (typeof this.wistiaEmbed == "object") {
            this.wistiaEmbed.remove();
            this.wistiaEmbed = null
        }
        this.$el.css("display", "none");
        studio.css("height", "");
    }
};
VideoTutorial.tutorials = {};