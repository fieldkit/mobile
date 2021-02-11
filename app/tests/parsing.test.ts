import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { transform } from "@/reader/parsing";

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
    });
});

// You can probably ignore this I was having issues with ts-jest and loading types.
describe("jest types", () => {
    it("should load @types", () => {
        expect(_([1, 2]).sum()).toBe(3);
    });
});
