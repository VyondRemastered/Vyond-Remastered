/***
 * database
 */
const fs = require("fs");

module.exports = class {
    constructor(isSettings = false) {
        if (!isSettings) {
            this.path = `${__dirname}/../.${process.env.ASSET_FOLDER}/database.json`;
            // create the file if it doesn't exist
            if (!fs.existsSync(this.path)) {
                const dirs = [process.env.SAVED_FOLDER, process.env.CACHÉ_FOLDER, process.env.ASSET_FOLDER, process.env.WATERMARKS_FOLDER];
                for (const dir of dirs) if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                console.error("Database doesn't exist! Creating...")
                this.save({assets: [], movieDates: {}, folders: [], movies: []});
            } try {
                this.refresh();
            } catch (err) {
                console.error("Error loading DB: " + err)
                // return a fake db
                return {assets: [], movieDates: {}, folders: [], movies: []};
            }
        } else {
            this.path = `${__dirname}/../.${process.env.ASSET_FOLDER}/settings.json`;
            // create the file if it doesn't exist
            if (!fs.existsSync(this.path)) {
                console.error("Database doesn't exist! Creating...")
                this.save({ waveform: true, rpc: false, studio: { filename: "studio", tutorial: 'y' }, year: "2016"  })
            } try {
                this.refresh();
            } catch (err) {
                console.error("Error loading DB: " + err)
                // return a fake db
                return { waveform: true, rpc: false, studio: { filename: "studio", tutorial: 'y' }, year: "2016" };
            }
        }
    }
    select(from, where) {
        this.refresh();

        let json;
        if (from) {
            json = this.json[from];
            const filtered = json.filter((val) => {
                for (const [key, value] of Object.entries(where || {})) {
                    if (val[key] && val[key] != value) {
                        return false;
                    }
                }
                return true;
            });
            return filtered;
        }
        return this.json;
    }
    refresh() { // refresh the database vars
        const data = fs.readFileSync(this.path);
        this.json = JSON.parse(data);
    }
    get() { this.refresh(); return this.json }
    save(newData) {
        try {
            fs.writeFileSync(this.path, JSON.stringify(newData, null, "\t"));
            return true;
        } catch (err) {
            console.error("Error saving content to DB: " + err);
            return false;
        }
    }
};