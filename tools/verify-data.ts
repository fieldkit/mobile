import _ from "lodash";
import fs from "fs";
import { promises as fsPromises } from "fs";
import request from "request";
import { download } from "../app/reader/download";
import Jimp from "jimp";

const baseUrl = "https://strapi.conservify.org";

async function saveToFile(uri: string, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        request(uri)
            .pipe(fs.createWriteStream(filename))
            .on("close", () => {
                resolve();
            });
    });
}

async function downloadAllPhotos(urls: string[]): Promise<any> {
    for (const relativeUrl of urls) {
        const url = baseUrl + relativeUrl;
        const path = "../app/images/reader" + relativeUrl;
        console.log("downloading", url, path);
        await saveToFile(url, path);

        const loaded = await Jimp.read(path);
        await loaded.resize(800, 800);
        await loaded.writeAsync(path);
    }
}

async function main() {
    const incoming = await download(baseUrl);

    if (!_.includes(process.argv, "--json")) {
        const urls = _.flatten(_.flatten(incoming.data.screens.map((s) => s.simple.map((ss) => ss.images.map((i) => i.url)))));

        await downloadAllPhotos(urls);
    }

    console.log("looks good!");

    await fsPromises.writeFile("../app/data/flows.json", JSON.stringify(incoming, null, 4));
}

Promise.resolve(main())
    .then(() => {
        console.log("done");
    })
    .catch((err) => {
        console.log("error", err);
        process.exit(2);
    });
