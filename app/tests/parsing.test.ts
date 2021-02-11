import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { transform } from "@/reader/parsing";
// import { promises as fsPromises } from "fs";
// await fsPromises.writeFile("temp.json", JSON.stringify(actual, null, 4));

describe("reader parsing", () => {
    describe("basic", () => {
        it("should parse simple text", async () => {
            const actual = await transform("Hello, world");

            expect(actual).toEqual({
                type: "StackLayout",
                props: {
                    class: "md-tree",
                },
                children: [
                    {
                        type: "StackLayout",
                        props: {
                            class: "md-paragraph",
                        },
                        children: [
                            {
                                type: "Label",
                                props: {
                                    text: "Hello, world",
                                    textWrap: true,
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should parse complete example", async () => {
            const actual = await transform(`
# Heading

## Another header

Paragraph of text, hello there how are you doing I hope this finds you well.

LEFT         | RIGHT
------------ | -------------
A            | B
A            | B
`);

            expect(actual).toEqual({
                type: "StackLayout",
                props: {
                    class: "md-tree",
                },
                children: [
                    {
                        type: "StackLayout",
                        props: {
                            class: "md-heading md-heading-${node.depth}",
                        },
                        children: [
                            {
                                type: "Label",
                                props: {
                                    text: "Heading",
                                    textWrap: true,
                                },
                            },
                        ],
                    },
                    {
                        type: "StackLayout",
                        props: {
                            class: "md-heading md-heading-${node.depth}",
                        },
                        children: [
                            {
                                type: "Label",
                                props: {
                                    text: "Another header",
                                    textWrap: true,
                                },
                            },
                        ],
                    },
                    {
                        type: "StackLayout",
                        props: {
                            class: "md-paragraph",
                        },
                        children: [
                            {
                                type: "Label",
                                props: {
                                    text: "Paragraph of text, hello there how are you doing I hope this finds you well.",
                                    textWrap: true,
                                },
                            },
                        ],
                    },
                    {
                        type: "GridLayout",
                        props: {
                            class: "md-grid",
                            rows: "auto",
                            columns: "*,*",
                        },
                        children: [
                            {
                                type: "StackLayout",
                                props: {
                                    col: 0,
                                    class: "md-column",
                                },
                                children: [
                                    {
                                        type: "Label",
                                        props: {
                                            text: "LEFT",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "A",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "A",
                                            textWrap: true,
                                        },
                                    },
                                ],
                            },
                            {
                                type: "StackLayout",
                                props: {
                                    col: 1,
                                    class: "md-column",
                                },
                                children: [
                                    {
                                        type: "Label",
                                        props: {
                                            text: "RIGHT",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "B",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "B",
                                            textWrap: true,
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should parse grid style 1", async () => {
            const actual = await transform(`

| LEFT    | RIGHT |
| :---    |  ---: |
| A       | B     |
| A       | B     |

`);

            expect(actual).toEqual({
                type: "StackLayout",
                props: {
                    class: "md-tree",
                },
                children: [
                    {
                        type: "GridLayout",
                        props: {
                            class: "md-grid",
                            rows: "auto",
                            columns: "*,*",
                        },
                        children: [
                            {
                                type: "StackLayout",
                                props: {
                                    col: 0,
                                    class: "md-column",
                                },
                                children: [
                                    {
                                        type: "Label",
                                        props: {
                                            text: "LEFT",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "A",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "A",
                                            textWrap: true,
                                        },
                                    },
                                ],
                            },
                            {
                                type: "StackLayout",
                                props: {
                                    col: 1,
                                    class: "md-column",
                                },
                                children: [
                                    {
                                        type: "Label",
                                        props: {
                                            text: "RIGHT",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "B",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "B",
                                            textWrap: true,
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should parse grid style 2", async () => {
            const actual = await transform(`

LEFT             | RIGHT
---------------|-------------
1. Flour         | 500g
2. Water       | 220g
3. Salt           | 1/4 tsp

`);

            expect(actual).toEqual({
                type: "StackLayout",
                props: {
                    class: "md-tree",
                },
                children: [
                    {
                        type: "GridLayout",
                        props: {
                            class: "md-grid",
                            rows: "auto",
                            columns: "*,*",
                        },
                        children: [
                            {
                                type: "StackLayout",
                                props: {
                                    col: 0,
                                    class: "md-column",
                                },
                                children: [
                                    {
                                        type: "Label",
                                        props: {
                                            text: "LEFT",
                                            textWrap: true,
                                        },
                                    },
                                ],
                            },
                            {
                                type: "StackLayout",
                                props: {
                                    col: 1,
                                    class: "md-column",
                                },
                                children: [
                                    {
                                        type: "Label",
                                        props: {
                                            text: "RIGHT",
                                            textWrap: true,
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: "StackLayout",
                        props: {
                            class: "md-list",
                        },
                        children: [
                            {
                                type: "StackLayout",
                                props: {
                                    class: "md-list-item",
                                },
                                children: [
                                    {
                                        type: "StackLayout",
                                        props: {
                                            class: "md-paragraph",
                                        },
                                        children: [
                                            {
                                                type: "Label",
                                                props: {
                                                    text: "Flour         | 500g",
                                                    textWrap: true,
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: "StackLayout",
                                props: {
                                    class: "md-list-item",
                                },
                                children: [
                                    {
                                        type: "StackLayout",
                                        props: {
                                            class: "md-paragraph",
                                        },
                                        children: [
                                            {
                                                type: "Label",
                                                props: {
                                                    text: "Water       | 220g",
                                                    textWrap: true,
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: "StackLayout",
                                props: {
                                    class: "md-list-item",
                                },
                                children: [
                                    {
                                        type: "StackLayout",
                                        props: {
                                            class: "md-paragraph",
                                        },
                                        children: [
                                            {
                                                type: "Label",
                                                props: {
                                                    text: "Salt           | 1/4 tsp",
                                                    textWrap: true,
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should parse grid style 2", async () => {
            const actual = await transform(`
# Heading

## Another header

Paragraph of text, hello there how are you doing I hope this finds you well.

| LEFT           | RIGHT      |
|----------------|------------|
| 1. Flour       | 500g       |
| 2. Water       | 220g       |
| 3. Salt        | 1/4 tsp    |

Tables don't need to line up exactly in this editor, though that makes things easier to read.

`);

            expect(actual).toEqual({
                type: "StackLayout",
                props: {
                    class: "md-tree",
                },
                children: [
                    {
                        type: "StackLayout",
                        props: {
                            class: "md-heading md-heading-${node.depth}",
                        },
                        children: [
                            {
                                type: "Label",
                                props: {
                                    text: "Heading",
                                    textWrap: true,
                                },
                            },
                        ],
                    },
                    {
                        type: "StackLayout",
                        props: {
                            class: "md-heading md-heading-${node.depth}",
                        },
                        children: [
                            {
                                type: "Label",
                                props: {
                                    text: "Another header",
                                    textWrap: true,
                                },
                            },
                        ],
                    },
                    {
                        type: "StackLayout",
                        props: {
                            class: "md-paragraph",
                        },
                        children: [
                            {
                                type: "Label",
                                props: {
                                    text: "Paragraph of text, hello there how are you doing I hope this finds you well.",
                                    textWrap: true,
                                },
                            },
                        ],
                    },
                    {
                        type: "GridLayout",
                        props: {
                            class: "md-grid",
                            rows: "auto",
                            columns: "*,*",
                        },
                        children: [
                            {
                                type: "StackLayout",
                                props: {
                                    col: 0,
                                    class: "md-column",
                                },
                                children: [
                                    {
                                        type: "Label",
                                        props: {
                                            text: "LEFT",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "1. Flour",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "2. Water",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "3. Salt",
                                            textWrap: true,
                                        },
                                    },
                                ],
                            },
                            {
                                type: "StackLayout",
                                props: {
                                    col: 1,
                                    class: "md-column",
                                },
                                children: [
                                    {
                                        type: "Label",
                                        props: {
                                            text: "RIGHT",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "500g",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "220g",
                                            textWrap: true,
                                        },
                                    },
                                    {
                                        type: "Label",
                                        props: {
                                            text: "1/4 tsp",
                                            textWrap: true,
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: "StackLayout",
                        props: {
                            class: "md-paragraph",
                        },
                        children: [
                            {
                                type: "Label",
                                props: {
                                    text: "Tables don't need to line up exactly in this editor, though that makes things easier to read.",
                                    textWrap: true,
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });
});

// You can probably ignore this I was having issues with ts-jest and loading types.
describe("jest types", () => {
    it("should load @types", () => {
        expect(_([1, 2]).sum()).toBe(3);
    });
});
