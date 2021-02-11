import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { transform } from "@/reader/parsing";

function debug(node) {
    console.log(JSON.stringify(node, null, 2));
}

describe("reader parsing", () => {
    describe("basic", () => {
        it("should parse multiline text", async () => {
            const actual = await transform("Hello, world");

            if (false) {
                debug(actual);

                debug(await transform("Hello, world"));

                debug(await transform("# Hello"));

                debug(await transform("Hello, world\n\n# Ok"));

                debug(
                    await transform(`
1. A
2. B
3. C
`)
                );

                debug(
                    await transform(`
Ok

| a | b  |
| a | b
| - | :- |


LEFT         | RIGHT
------------ | -------------
A            | B
A            | B

Cool
`)
                );
            }

            debug(
                await transform(`
# Heading

## Another header

Paragraph of text, hello there how are you doing I hope this finds you well.

LEFT         | RIGHT
------------ | -------------
A            | B
A            | B
`)
            );
        });
    });
});

// You can probably ignore this I was having issues with ts-jest and loading types.
describe("jest types", () => {
    it("should load @types", () => {
        expect(_([1, 2]).sum()).toBe(3);
    });
});
