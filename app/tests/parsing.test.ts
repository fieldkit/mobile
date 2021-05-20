import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { transform } from "@/reader/parsing";
import { promises as fsPromises } from "fs";

export async function saveJson(obj: unknown): Promise<void> {
    await fsPromises.writeFile("temp.json", JSON.stringify(obj, null, 4));
}

describe("reader parsing", () => {
    describe("basic", () => {
        it("should parse simple text", async () => {
            const actual = await transform("Hello, world");

            expect(actual).toEqual({
                type: "MarkdownRoot",
                props: {
                    parsed: [
                        {
                            type: "FlexboxLayout",
                            props: {
                                class: "md-paragraph",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                images: 0,
                                row: 0,
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
                },
                children: [
                    {
                        type: "FlexboxLayout",
                        props: {
                            class: "md-paragraph",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            images: 0,
                            row: 0,
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

        it("should parse text surrounded by image", async () => {
            const actual = await transform("Hello, world\n\n![Alt](0)\n\nBye, world!\n");

            expect(actual).toEqual({
                type: "MarkdownRoot",
                props: {
                    parsed: [
                        {
                            type: "FlexboxLayout",
                            props: {
                                class: "md-paragraph",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                images: 0,
                                row: 0,
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
                        {
                            type: "FlexboxLayout",
                            props: {
                                class: "md-paragraph",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                images: 1,
                                row: 1,
                            },
                            children: [
                                {
                                    type: "MarkdownImage",
                                    props: {
                                        indices: [0],
                                        alternate: "Alt",
                                        sizing: "*",
                                    },
                                    children: [],
                                },
                            ],
                        },
                        {
                            type: "FlexboxLayout",
                            props: {
                                class: "md-paragraph",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                images: 0,
                                row: 2,
                            },
                            children: [
                                {
                                    type: "Label",
                                    props: {
                                        text: "Bye, world!",
                                        textWrap: true,
                                    },
                                },
                            ],
                        },
                    ],
                },
                children: [
                    {
                        type: "FlexboxLayout",
                        props: {
                            class: "md-paragraph",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            images: 0,
                            row: 0,
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
                    {
                        type: "FlexboxLayout",
                        props: {
                            class: "md-paragraph",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            images: 1,
                            row: 1,
                        },
                        children: [
                            {
                                type: "MarkdownImage",
                                props: {
                                    indices: [0],
                                    alternate: "Alt",
                                    sizing: "*",
                                },
                                children: [],
                            },
                        ],
                    },
                    {
                        type: "FlexboxLayout",
                        props: {
                            class: "md-paragraph",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            images: 0,
                            row: 2,
                        },
                        children: [
                            {
                                type: "Label",
                                props: {
                                    text: "Bye, world!",
                                    textWrap: true,
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should parse links in headings", async () => {
            const actual = await transform("## This is an [example link](http://example.com/) of a link.");

            expect(actual).toEqual({
                type: "MarkdownRoot",
                props: {
                    parsed: [
                        {
                            type: "FlexboxLayout",
                            props: {
                                class: "md-heading md-heading-2",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                row: 0,
                            },
                            children: [
                                {
                                    type: "Label",
                                    props: {
                                        text: "This is an ",
                                        textWrap: true,
                                    },
                                },
                                {
                                    type: "MarkdownLink",
                                    props: {
                                        target: "http://example.com/",
                                    },
                                    children: [
                                        {
                                            type: "Label",
                                            props: {
                                                text: "example link",
                                                textWrap: true,
                                            },
                                        },
                                    ],
                                },
                                {
                                    type: "Label",
                                    props: {
                                        text: " of a link.",
                                        textWrap: true,
                                    },
                                },
                            ],
                        },
                    ],
                },
                children: [
                    {
                        type: "FlexboxLayout",
                        props: {
                            class: "md-heading md-heading-2",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            row: 0,
                        },
                        children: [
                            {
                                type: "Label",
                                props: {
                                    text: "This is an ",
                                    textWrap: true,
                                },
                            },
                            {
                                type: "MarkdownLink",
                                props: {
                                    target: "http://example.com/",
                                },
                                children: [
                                    {
                                        type: "Label",
                                        props: {
                                            text: "example link",
                                            textWrap: true,
                                        },
                                    },
                                ],
                            },
                            {
                                type: "Label",
                                props: {
                                    text: " of a link.",
                                    textWrap: true,
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should parse simple links", async () => {
            const actual = await transform("This is an [example link](http://example.com/).");

            expect(actual).toEqual({
                type: "MarkdownRoot",
                props: {
                    parsed: [
                        {
                            type: "FlexboxLayout",
                            props: {
                                class: "md-paragraph",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                images: 0,
                                row: 0,
                            },
                            children: [
                                {
                                    type: "Label",
                                    props: {
                                        text: "This is an ",
                                        textWrap: true,
                                    },
                                },
                                {
                                    type: "MarkdownLink",
                                    props: {
                                        target: "http://example.com/",
                                    },
                                    children: [
                                        {
                                            type: "Label",
                                            props: {
                                                text: "example link",
                                                textWrap: true,
                                            },
                                        },
                                    ],
                                },
                                {
                                    type: "Label",
                                    props: {
                                        text: ".",
                                        textWrap: true,
                                    },
                                },
                            ],
                        },
                    ],
                },
                children: [
                    {
                        type: "FlexboxLayout",
                        props: {
                            class: "md-paragraph",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            images: 0,
                            row: 0,
                        },
                        children: [
                            {
                                type: "Label",
                                props: {
                                    text: "This is an ",
                                    textWrap: true,
                                },
                            },
                            {
                                type: "MarkdownLink",
                                props: {
                                    target: "http://example.com/",
                                },
                                children: [
                                    {
                                        type: "Label",
                                        props: {
                                            text: "example link",
                                            textWrap: true,
                                        },
                                    },
                                ],
                            },
                            {
                                type: "Label",
                                props: {
                                    text: ".",
                                    textWrap: true,
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should parse simple list", async () => {
            const actual = await transform("1. Item\n2. Item\n3. Item\n");

            expect(actual).toEqual({
                type: "MarkdownRoot",
                props: {
                    parsed: [
                        {
                            type: "StackLayout",
                            props: {
                                class: "md-list",
                                row: 0,
                            },
                            children: [
                                {
                                    type: "StackLayout",
                                    props: {
                                        class: "md-list-item",
                                    },
                                    children: [
                                        {
                                            type: "FlexboxLayout",
                                            props: {
                                                class: "md-paragraph",
                                                justifyContent: "center",
                                                flexWrap: "wrap",
                                                images: 0,
                                            },
                                            children: [
                                                {
                                                    type: "Label",
                                                    props: {
                                                        text: "Item",
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
                                            type: "FlexboxLayout",
                                            props: {
                                                class: "md-paragraph",
                                                justifyContent: "center",
                                                flexWrap: "wrap",
                                                images: 0,
                                            },
                                            children: [
                                                {
                                                    type: "Label",
                                                    props: {
                                                        text: "Item",
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
                                            type: "FlexboxLayout",
                                            props: {
                                                class: "md-paragraph",
                                                justifyContent: "center",
                                                flexWrap: "wrap",
                                                images: 0,
                                            },
                                            children: [
                                                {
                                                    type: "Label",
                                                    props: {
                                                        text: "Item",
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
                },
                children: [
                    {
                        type: "StackLayout",
                        props: {
                            class: "md-list",
                            row: 0,
                        },
                        children: [
                            {
                                type: "StackLayout",
                                props: {
                                    class: "md-list-item",
                                },
                                children: [
                                    {
                                        type: "FlexboxLayout",
                                        props: {
                                            class: "md-paragraph",
                                            justifyContent: "center",
                                            flexWrap: "wrap",
                                            images: 0,
                                        },
                                        children: [
                                            {
                                                type: "Label",
                                                props: {
                                                    text: "Item",
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
                                        type: "FlexboxLayout",
                                        props: {
                                            class: "md-paragraph",
                                            justifyContent: "center",
                                            flexWrap: "wrap",
                                            images: 0,
                                        },
                                        children: [
                                            {
                                                type: "Label",
                                                props: {
                                                    text: "Item",
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
                                        type: "FlexboxLayout",
                                        props: {
                                            class: "md-paragraph",
                                            justifyContent: "center",
                                            flexWrap: "wrap",
                                            images: 0,
                                        },
                                        children: [
                                            {
                                                type: "Label",
                                                props: {
                                                    text: "Item",
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
                type: "MarkdownRoot",
                props: {
                    parsed: [
                        {
                            type: "FlexboxLayout",
                            props: {
                                class: "md-heading md-heading-1",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                row: 0,
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
                            type: "FlexboxLayout",
                            props: {
                                class: "md-heading md-heading-2",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                row: 1,
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
                            type: "FlexboxLayout",
                            props: {
                                class: "md-paragraph",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                images: 0,
                                row: 2,
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
                                row: 3,
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
                },
                children: [
                    {
                        type: "FlexboxLayout",
                        props: {
                            class: "md-heading md-heading-1",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            row: 0,
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
                        type: "FlexboxLayout",
                        props: {
                            class: "md-heading md-heading-2",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            row: 1,
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
                        type: "FlexboxLayout",
                        props: {
                            class: "md-paragraph",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            images: 0,
                            row: 2,
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
                            row: 3,
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
                type: "MarkdownRoot",
                props: {
                    parsed: [
                        {
                            type: "GridLayout",
                            props: {
                                class: "md-grid",
                                rows: "auto",
                                columns: "*,*",
                                row: 0,
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
                },
                children: [
                    {
                        type: "GridLayout",
                        props: {
                            class: "md-grid",
                            rows: "auto",
                            columns: "*,*",
                            row: 0,
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

        it("should parse grid style 3", async () => {
            const actual = await transform(`

| LEFT           | RIGHT    |
|----------------|----------|
| 1. Flour       | 500g     |
| 2. Water       | 220g     |
| 3. Salt        | 1/4 tsp  |

`);

            expect(actual).toEqual({
                type: "MarkdownRoot",
                props: {
                    parsed: [
                        {
                            type: "GridLayout",
                            props: {
                                class: "md-grid",
                                rows: "auto",
                                columns: "*,*",
                                row: 0,
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
                                            type: "GridLayout",
                                            props: {
                                                class: "md-grid",
                                                rows: "auto,auto,auto",
                                                columns: "auto,*",
                                            },
                                            children: [
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-key",
                                                        row: 0,
                                                        col: 0,
                                                        text: "1.",
                                                        textWrap: false,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-key",
                                                        row: 1,
                                                        col: 0,
                                                        text: "2.",
                                                        textWrap: false,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-key",
                                                        row: 2,
                                                        col: 0,
                                                        text: "3.",
                                                        textWrap: false,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-value",
                                                        row: 0,
                                                        col: 1,
                                                        text: "Flour",
                                                        textWrap: true,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-value",
                                                        row: 1,
                                                        col: 1,
                                                        text: "Water",
                                                        textWrap: true,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-value",
                                                        row: 2,
                                                        col: 1,
                                                        text: "Salt",
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
                                        col: 1,
                                        class: "md-column",
                                    },
                                    children: [
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
                    ],
                },
                children: [
                    {
                        type: "GridLayout",
                        props: {
                            class: "md-grid",
                            rows: "auto",
                            columns: "*,*",
                            row: 0,
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
                                        type: "GridLayout",
                                        props: {
                                            class: "md-grid",
                                            rows: "auto,auto,auto",
                                            columns: "auto,*",
                                        },
                                        children: [
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-key",
                                                    row: 0,
                                                    col: 0,
                                                    text: "1.",
                                                    textWrap: false,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-key",
                                                    row: 1,
                                                    col: 0,
                                                    text: "2.",
                                                    textWrap: false,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-key",
                                                    row: 2,
                                                    col: 0,
                                                    text: "3.",
                                                    textWrap: false,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-value",
                                                    row: 0,
                                                    col: 1,
                                                    text: "Flour",
                                                    textWrap: true,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-value",
                                                    row: 1,
                                                    col: 1,
                                                    text: "Water",
                                                    textWrap: true,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-value",
                                                    row: 2,
                                                    col: 1,
                                                    text: "Salt",
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
                                    col: 1,
                                    class: "md-column",
                                },
                                children: [
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
                ],
            });
        });

        it("should parse grid style 2", async () => {
            const actual = await transform(`

| LEFT           | RIGHT
| ---------------|-------------
| 1. Flour       | 500g
| 2. Water       | 220g
| 3. Salt        | 1/4 tsp

`);

            expect(actual).toEqual({
                type: "MarkdownRoot",
                props: {
                    parsed: [
                        {
                            type: "GridLayout",
                            props: {
                                class: "md-grid",
                                rows: "auto",
                                columns: "*,*",
                                row: 0,
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
                                            type: "GridLayout",
                                            props: {
                                                class: "md-grid",
                                                rows: "auto,auto,auto",
                                                columns: "auto,*",
                                            },
                                            children: [
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-key",
                                                        row: 0,
                                                        col: 0,
                                                        text: "1.",
                                                        textWrap: false,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-key",
                                                        row: 1,
                                                        col: 0,
                                                        text: "2.",
                                                        textWrap: false,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-key",
                                                        row: 2,
                                                        col: 0,
                                                        text: "3.",
                                                        textWrap: false,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-value",
                                                        row: 0,
                                                        col: 1,
                                                        text: "Flour",
                                                        textWrap: true,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-value",
                                                        row: 1,
                                                        col: 1,
                                                        text: "Water",
                                                        textWrap: true,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-value",
                                                        row: 2,
                                                        col: 1,
                                                        text: "Salt",
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
                                        col: 1,
                                        class: "md-column",
                                    },
                                    children: [
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
                    ],
                },
                children: [
                    {
                        type: "GridLayout",
                        props: {
                            class: "md-grid",
                            rows: "auto",
                            columns: "*,*",
                            row: 0,
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
                                        type: "GridLayout",
                                        props: {
                                            class: "md-grid",
                                            rows: "auto,auto,auto",
                                            columns: "auto,*",
                                        },
                                        children: [
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-key",
                                                    row: 0,
                                                    col: 0,
                                                    text: "1.",
                                                    textWrap: false,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-key",
                                                    row: 1,
                                                    col: 0,
                                                    text: "2.",
                                                    textWrap: false,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-key",
                                                    row: 2,
                                                    col: 0,
                                                    text: "3.",
                                                    textWrap: false,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-value",
                                                    row: 0,
                                                    col: 1,
                                                    text: "Flour",
                                                    textWrap: true,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-value",
                                                    row: 1,
                                                    col: 1,
                                                    text: "Water",
                                                    textWrap: true,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-value",
                                                    row: 2,
                                                    col: 1,
                                                    text: "Salt",
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
                                    col: 1,
                                    class: "md-column",
                                },
                                children: [
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
                type: "MarkdownRoot",
                props: {
                    parsed: [
                        {
                            type: "FlexboxLayout",
                            props: {
                                class: "md-heading md-heading-1",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                row: 0,
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
                            type: "FlexboxLayout",
                            props: {
                                class: "md-heading md-heading-2",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                row: 1,
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
                            type: "FlexboxLayout",
                            props: {
                                class: "md-paragraph",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                images: 0,
                                row: 2,
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
                                row: 3,
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
                                            type: "GridLayout",
                                            props: {
                                                class: "md-grid",
                                                rows: "auto,auto,auto",
                                                columns: "auto,*",
                                            },
                                            children: [
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-key",
                                                        row: 0,
                                                        col: 0,
                                                        text: "1.",
                                                        textWrap: false,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-key",
                                                        row: 1,
                                                        col: 0,
                                                        text: "2.",
                                                        textWrap: false,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-key",
                                                        row: 2,
                                                        col: 0,
                                                        text: "3.",
                                                        textWrap: false,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-value",
                                                        row: 0,
                                                        col: 1,
                                                        text: "Flour",
                                                        textWrap: true,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-value",
                                                        row: 1,
                                                        col: 1,
                                                        text: "Water",
                                                        textWrap: true,
                                                    },
                                                },
                                                {
                                                    type: "Label",
                                                    props: {
                                                        class: "md-seq-value",
                                                        row: 2,
                                                        col: 1,
                                                        text: "Salt",
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
                                        col: 1,
                                        class: "md-column",
                                    },
                                    children: [
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
                            type: "FlexboxLayout",
                            props: {
                                class: "md-paragraph",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                images: 0,
                                row: 4,
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
                },
                children: [
                    {
                        type: "FlexboxLayout",
                        props: {
                            class: "md-heading md-heading-1",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            row: 0,
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
                        type: "FlexboxLayout",
                        props: {
                            class: "md-heading md-heading-2",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            row: 1,
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
                        type: "FlexboxLayout",
                        props: {
                            class: "md-paragraph",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            images: 0,
                            row: 2,
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
                            row: 3,
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
                                        type: "GridLayout",
                                        props: {
                                            class: "md-grid",
                                            rows: "auto,auto,auto",
                                            columns: "auto,*",
                                        },
                                        children: [
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-key",
                                                    row: 0,
                                                    col: 0,
                                                    text: "1.",
                                                    textWrap: false,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-key",
                                                    row: 1,
                                                    col: 0,
                                                    text: "2.",
                                                    textWrap: false,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-key",
                                                    row: 2,
                                                    col: 0,
                                                    text: "3.",
                                                    textWrap: false,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-value",
                                                    row: 0,
                                                    col: 1,
                                                    text: "Flour",
                                                    textWrap: true,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-value",
                                                    row: 1,
                                                    col: 1,
                                                    text: "Water",
                                                    textWrap: true,
                                                },
                                            },
                                            {
                                                type: "Label",
                                                props: {
                                                    class: "md-seq-value",
                                                    row: 2,
                                                    col: 1,
                                                    text: "Salt",
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
                                    col: 1,
                                    class: "md-column",
                                },
                                children: [
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
                        type: "FlexboxLayout",
                        props: {
                            class: "md-paragraph",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            images: 0,
                            row: 4,
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
