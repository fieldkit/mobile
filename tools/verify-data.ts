import _ from "lodash";
import fs from "fs";
import { promises as fsPromises } from "fs";
import request from "request";
import axios from "axios";
import Jimp from "jimp";

import flowSchema from "../app/data/flow-schema";

import * as convertKeys from "convert-keys";

const baseUrl = "https://strapi.conservify.org";

function download(): Promise<any> {
    const query = {
        query: `
        {
            flows {
                id
                name
                show_progress
            }
            screens {
                id
                name
                locale
                forward
                skip
				guide_title
				guide_url
                header { title subtitle }
                simple {
                    body
                    images { url }
                }
            }
        }
        `,
    };

    return axios({
        method: "POST",
        url: baseUrl + "/graphql",
        data: query,
        transformResponse: (res) => {
            const fixed = res.replace(String.fromCharCode(8232), "\\n");
            return JSON.parse(fixed);
        },
    })
        .then((response) => {
            console.log("data", response.data);
            return response.data;
        })
        .then((data) => {
            return data;
        });
}

async function saveToFile(uri: string, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        request(uri)
            .pipe(fs.createWriteStream(filename))
            .on("close", () => {
                resolve();
            });
    });
}

async function downloadAllPhotos(flows: any): Promise<any> {
    for (const screen of flows.data.screens) {
        for (const simple of screen.simple) {
            for (const image of simple.images) {
                const relativeUrl = image.url;
                const url = baseUrl + relativeUrl;
                const path = "../app/images/reader" + relativeUrl;
                console.log("downloading", url, path);
                await saveToFile(url, path);

                const loaded = await Jimp.read(path);
                await loaded.resize(800, 800);
                await loaded.writeAsync(path);
            }
        }
    }
}

async function main() {
    console.log("downloading...");
    const incoming = convertKeys.toCamel(await download());

    console.log("verifying...");
    await flowSchema.validate(incoming);

    if (!_.includes(process.argv, "--json")) {
        await downloadAllPhotos(incoming);
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
