#!/usr/bin/python3

import requests
import logging
import json
import sys


def main():
    logging.basicConfig(stream=sys.stdout, level=logging.INFO)

    data = {
        "query": """
        {
            flows {
                id
                name
                show_progress
                screens {
                    name
                    locale
                    header { title subtitle }
                    simple {
                        body
                        images { url }
                    }
                }
            }
        }
        """
    }

    url = "https://strapi.conservify.org"

    logging.info("querying json...")

    r = requests.post(url + "/graphql", data=data)
    flows = r.json()

    for flow in flows["data"]["flows"]:
        for screen in flow["screens"]:
            for simple in screen["simple"]:
                for image in simple["images"]:
                    relativeUrl = image["url"]
                    logging.info(relativeUrl)
                    imageUrl = url + relativeUrl
                    r = requests.get(imageUrl, allow_redirects=True)
                    with open("app/images/reader/" + relativeUrl, "wb") as file:
                        file.write(r.content)

    with open("app/data/flows.json", "w") as file:
        file.write(json.dumps(flows))


if __name__ == "__main__":
    main()
