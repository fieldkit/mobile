import _ from "lodash";
import fs from "fs";
import { promises as fsPromises } from "fs";
import request from "request";
import axios from "axios";

import flowSchema from "../app/data/flow-schema";

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
    }).then((response) => {
        console.log("data", response.data);
        return response.data;
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
            }
        }
    }
}

async function main() {
    console.log("downloading...");
    const incoming = await download();

    console.log("verifying...");
    await flowSchema.validate(incoming);

    await downloadAllPhotos(incoming);

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
